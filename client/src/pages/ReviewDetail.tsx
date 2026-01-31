import { useParams, Link } from "wouter";
import { useState } from "react";
import { useReview, useReviewDocuments, useComplianceMatrix, useUploadDocument, useGenerateCompliance, useGenerateICD } from "@/hooks/use-reviews";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, CheckCircle2, UploadCloud, BrainCircuit, Play, Loader2, AlertCircle, ShieldCheck, FileOutput, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ReviewDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const [icdContent, setIcdContent] = useState<string | null>(null);
  const [showIcdPanel, setShowIcdPanel] = useState(false);

  const { data: review, isLoading: reviewLoading } = useReview(id);
  const { data: documents, isLoading: docsLoading } = useReviewDocuments(id);
  const { data: compliance, isLoading: complianceLoading } = useComplianceMatrix(id);
  
  const uploadMutation = useUploadDocument();
  const generateMutation = useGenerateCompliance();
  const icdMutation = useGenerateICD();

  const handleUpload = (type: string, name: string) => {
    // In a real app, this would trigger a file picker
    // For this prototype, we simulate uploading the specific files mentioned in requirements
    
    // Static assets mapped to types
    const staticAssets: Record<string, string> = {
      'Host PUG': '/assets/Momentus_Users_Guide_Feb_2023_REV4_1769671028969.pdf',
      'Payload Spec': '/assets/datasheet-spiral-blue-space-edge-computer-se-2-sc8bob_1769671043574.pdf'
    };

    uploadMutation.mutate(
      {
        reviewId: id,
        name: name,
        type: type,
        fileUrl: staticAssets[type] || '',
        status: 'Uploaded'
      },
      {
        onSuccess: () => {
          toast({
            title: "File Uploaded",
            description: `${name} has been successfully added to the review context.`,
          });
        }
      }
    );
  };

  const handleGenerate = () => {
    generateMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Analysis Complete",
          description: "Compliance matrix has been generated from the documents.",
        });
      }
    });
  };

  const handleGenerateICD = () => {
    icdMutation.mutate(id, {
      onSuccess: (data) => {
        setIcdContent(data.icd);
        setShowIcdPanel(true);
        toast({
          title: "ICD Generated",
          description: "Draft Interface Control Document has been created.",
        });
      },
      onError: () => {
        toast({
          title: "Generation Failed",
          description: "Could not generate ICD. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleDownloadICD = () => {
    if (!icdContent) return;
    const blob = new Blob([icdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ICD-${review?.title?.replace(/\s+/g, '-') || 'Draft'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (reviewLoading || docsLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!review) return null;

  // Define required documents
  const requiredDocs = [
    { type: "Host PUG", label: "Host User Guide", defaultName: "Momentus Users Guide.pdf" },
    { type: "Payload Spec", label: "Payload Specification", defaultName: "Spiral Blue Datasheet.pdf" }
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-display text-foreground">{review.title}</h1>
                <StatusBadge status={review.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">ID: #{review.id} • Created {new Date(review.createdAt!).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">Export Report</Button>
            <Button className="gap-2 shadow-lg shadow-primary/20">Finalize Review</Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Documents & Actions */}
          <aside className="w-80 border-r border-border bg-muted/20 flex flex-col p-6 overflow-y-auto">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Input Documents
            </h2>
            
            <div className="space-y-4 mb-8">
              {requiredDocs.map((reqDoc) => {
                const uploadedDoc = documents?.find(d => d.type === reqDoc.type);
                const isUploaded = !!uploadedDoc;

                return (
                  <div key={reqDoc.type} className={cn(
                    "p-4 rounded-xl border transition-all",
                    isUploaded 
                      ? "bg-emerald-50/50 border-emerald-200" 
                      : "bg-card border-border border-dashed hover:border-primary/50"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{reqDoc.type}</span>
                      {isUploaded && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="font-medium text-sm mb-3 truncate" title={uploadedDoc?.name || reqDoc.defaultName}>
                      {uploadedDoc?.name || reqDoc.defaultName}
                    </p>
                    
                    {isUploaded ? (
                      <div className="flex gap-2">
                         <a 
                           href={uploadedDoc.fileUrl} 
                           target="_blank" 
                           rel="noreferrer" 
                           className="text-xs text-primary font-medium hover:underline"
                         >
                           View Document
                         </a>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full gap-2 text-xs h-8"
                        onClick={() => handleUpload(reqDoc.type, reqDoc.defaultName)}
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                        Upload File
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-auto space-y-4">
              <div className="bg-card rounded-xl p-5 border border-primary/20 shadow-lg shadow-primary/5">
                <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-primary">
                  <BrainCircuit className="w-5 h-5" />
                  AI Analysis
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Extract requirements from documents and run compliance check against limits.
                </p>
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md transition-all"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !documents?.length}
                  data-testid="button-run-analysis"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Run Compliance Audit
                    </>
                  )}
                </Button>
              </div>

              {compliance && compliance.length > 0 && (
                <div className="bg-card rounded-xl p-5 border border-emerald-200 shadow-md">
                  <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-emerald-700">
                    <FileOutput className="w-5 h-5" />
                    Generate ICD
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create a draft Interface Control Document based on the compliance analysis.
                  </p>
                  <Button 
                    className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all"
                    onClick={handleGenerateICD}
                    disabled={icdMutation.isPending}
                    data-testid="button-generate-icd"
                  >
                    {icdMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating ICD...
                      </>
                    ) : (
                      <>
                        <FileOutput className="w-4 h-4" />
                        Generate Draft ICD
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content: Compliance Matrix */}
          <section className="flex-1 overflow-hidden flex flex-col bg-white">
            <div className="p-6 pb-0">
              <h2 className="font-display font-bold text-xl mb-1">Compliance Matrix</h2>
              <p className="text-sm text-muted-foreground">Automated requirement extraction and verification results.</p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {complianceLoading ? (
                 <div className="space-y-4">
                   {[1,2,3,4].map(i => <div key={i} className="h-16 w-full bg-muted/30 animate-pulse rounded-lg" />)}
                 </div>
              ) : compliance && compliance.length > 0 ? (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[300px]">Requirement (Shall)</TableHead>
                        <TableHead className="w-[150px]">Limit</TableHead>
                        <TableHead className="w-[150px]">Measured</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead>Recommended Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compliance.map((item) => (
                        <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">REQ-{item.id}</TableCell>
                          <TableCell className="font-medium text-sm">{item.category}</TableCell>
                          <TableCell className="text-sm">{item.requirement}</TableCell>
                          <TableCell className="font-mono text-xs">{item.limit}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{item.measured}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {item.action}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/10">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Requirements Extracted</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Upload the Host Users Guide and Payload Specification, then run the AI Compliance Audit to populate this matrix.
                  </p>
                  <Button variant="outline" onClick={handleGenerate} disabled={!documents?.length}>
                    Run Analysis Now
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ICD Preview Panel */}
          {showIcdPanel && icdContent && (
            <aside className="w-[500px] border-l border-border bg-card flex flex-col shadow-xl">
              <div className="p-4 border-b border-border flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-2">
                  <FileOutput className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-display font-bold text-emerald-800">Draft ICD</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1.5"
                    onClick={handleDownloadICD}
                    data-testid="button-download-icd"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => setShowIcdPanel(false)}
                    data-testid="button-close-icd"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-table:text-sm prose-th:bg-muted/30 prose-th:p-2 prose-td:p-2 prose-td:border prose-th:border">
                  {icdContent.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.slice(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-lg font-bold mt-5 mb-2 text-foreground border-b pb-1">{line.slice(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-foreground">{line.slice(4)}</h3>;
                    }
                    if (line.startsWith('| ')) {
                      return <pre key={i} className="text-xs font-mono bg-muted/20 px-2 py-0.5 overflow-x-auto">{line}</pre>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>;
                    }
                    if (line.trim() === '') {
                      return <div key={i} className="h-2" />;
                    }
                    return <p key={i} className="text-sm text-muted-foreground mb-2">{line}</p>;
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
