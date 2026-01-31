import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateReviewRequest } from "@shared/routes";

// ============================================
// REVIEWS HOOKS
// ============================================

export function useReviews() {
  return useQuery({
    queryKey: [api.reviews.list.path],
    queryFn: async () => {
      const res = await fetch(api.reviews.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return api.reviews.list.responses[200].parse(await res.json());
    },
  });
}

export function useReview(id: number) {
  return useQuery({
    queryKey: [api.reviews.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.reviews.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Review not found");
      if (!res.ok) throw new Error("Failed to fetch review");
      return api.reviews.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const res = await fetch(api.reviews.create.path, {
        method: api.reviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create review");
      return api.reviews.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.reviews.list.path] }),
  });
}

// ============================================
// DOCUMENTS HOOKS
// ============================================

export function useReviewDocuments(reviewId: number) {
  return useQuery({
    queryKey: [api.documents.list.path, reviewId],
    queryFn: async () => {
      const url = buildUrl(api.documents.list.path, { reviewId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return api.documents.list.responses[200].parse(await res.json());
    },
    enabled: !!reviewId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, ...data }: { reviewId: number; name: string; type: string; fileUrl: string }) => {
      const url = buildUrl(api.documents.upload.path, { reviewId });
      const res = await fetch(url, {
        method: api.documents.upload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload document");
      return api.documents.upload.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [api.documents.list.path, variables.reviewId] }),
  });
}

// ============================================
// COMPLIANCE HOOKS
// ============================================

export function useComplianceMatrix(reviewId: number) {
  return useQuery({
    queryKey: [api.compliance.list.path, reviewId],
    queryFn: async () => {
      const url = buildUrl(api.compliance.list.path, { reviewId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch compliance matrix");
      return api.compliance.list.responses[200].parse(await res.json());
    },
    enabled: !!reviewId,
  });
}

export function useGenerateCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: number) => {
      const url = buildUrl(api.compliance.generate.path, { reviewId });
      const res = await fetch(url, {
        method: api.compliance.generate.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate compliance matrix");
      return api.compliance.generate.responses[201].parse(await res.json());
    },
    onSuccess: (_, reviewId) => queryClient.invalidateQueries({ queryKey: [api.compliance.list.path, reviewId] }),
  });
}

// ============================================
// ICD GENERATION HOOKS
// ============================================

export function useGenerateICD() {
  return useMutation({
    mutationFn: async (reviewId: number) => {
      const url = buildUrl(api.icd.generate.path, { reviewId });
      const res = await fetch(url, {
        method: api.icd.generate.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate ICD");
      return api.icd.generate.responses[200].parse(await res.json());
    },
  });
}
