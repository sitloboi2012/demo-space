import { Link } from "wouter";
import { useReviews } from "@/hooks/use-reviews";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateReviewDialog } from "@/components/CreateReviewDialog";
import { format } from "date-fns";
import { ChevronRight, Rocket, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: reviews, isLoading, error } = useReviews();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Error loading dashboard</h2>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header Background Decoration */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display mb-1 text-foreground">Active Reviews</h1>
              <p className="text-muted-foreground">Manage and track your satellite compliance audits.</p>
            </div>
            <CreateReviewDialog />
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search reviews..." 
                className="pl-10 rounded-xl border-border bg-white/50 backdrop-blur-sm focus:bg-white transition-all"
              />
            </div>
            <Button variant="outline" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {reviews && reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <Link key={review.id} href={`/reviews/${review.id}`} className="group block">
                  <div className="bg-card hover:bg-white rounded-2xl p-6 border border-border hover:border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <StatusBadge status={review.status} />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {review.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-2">
                      {review.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm">
                      <span className="text-muted-foreground font-medium">
                        {review.createdAt && format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center text-primary font-semibold group-hover:translate-x-1 transition-transform">
                        Open Review <ChevronRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-2xl bg-muted/20">
              <Rocket className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No active reviews</h3>
              <p className="text-sm text-muted-foreground/70">Create a new review to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
