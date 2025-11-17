/**
 * Pagination Utility Functions
 * Standardized pagination logic for all API endpoints
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Calculate skip and take values from page and limit
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Object with skip and take values for Prisma
 */
export function calculatePagination(page: number = 1, limit: number = 25) {
  const pageNum = Math.max(1, page); // Ensure page is at least 1
  const limitNum = Math.max(1, Math.min(limit, 100)); // Cap limit at 100

  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum
  };
}

/**
 * Build pagination metadata response
 * @param total - Total count of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Build complete paginated response
 * @param items - Array of items
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 * @returns Complete pagination result
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
