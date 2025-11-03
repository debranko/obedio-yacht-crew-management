import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { prisma } from '../services/db';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/service-categories
 * Get all service categories
 */
router.get('/', requirePermission('settings.view'), asyncHandler(async (req, res) => {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: 'asc' }
  });

  res.json(apiSuccess(categories));
}));

/**
 * POST /api/service-categories
 * Create a new service category
 */
router.post('/', requirePermission('settings.edit'), asyncHandler(async (req, res) => {
  const { name, icon, color, description } = req.body;

  if (!name) {
    return res.status(400).json(apiError('Category name is required', 'VALIDATION_ERROR'));
  }

  // Get the highest order value
  const lastCategory = await prisma.serviceCategory.findFirst({
    orderBy: { order: 'desc' }
  });
  const order = (lastCategory?.order || 0) + 1;

  const category = await prisma.serviceCategory.create({
    data: {
      name,
      icon: icon || 'tag',
      color: color || 'gray',
      description,
      order
    }
  });

  res.status(201).json(apiSuccess(category));
}));

/**
 * PUT /api/service-categories/:id
 * Update a service category
 */
router.put('/:id', requirePermission('settings.edit'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, icon, color, description, order, isActive } = req.body;

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive })
    }
  });

  res.json(apiSuccess(category));
}));

/**
 * DELETE /api/service-categories/:id
 * Delete a service category
 */
router.delete('/:id', requirePermission('settings.edit'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category is in use
  const requestsCount = await prisma.serviceRequest.count({
    where: { categoryId: id }
  });

  if (requestsCount > 0) {
    return res.status(400).json(apiError(
      `Cannot delete category. It is used by ${requestsCount} service requests.`,
      'VALIDATION_ERROR'
    ));
  }

  await prisma.serviceCategory.delete({
    where: { id }
  });

  res.json(apiSuccess({ message: 'Category deleted successfully' }));
}));

/**
 * PUT /api/service-categories/reorder
 * Reorder service categories
 */
router.put('/reorder', requirePermission('settings.edit'), asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories)) {
    return res.status(400).json(apiError('Categories array is required', 'VALIDATION_ERROR'));
  }

  // Update order for each category
  await Promise.all(
    categories.map((cat, index) =>
      prisma.serviceCategory.update({
        where: { id: cat.id },
        data: { order: index }
      })
    )
  );

  res.json(apiSuccess({ message: 'Categories reordered successfully' }));
}));

export default router;