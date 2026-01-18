/**
 * @swagger
 * tags:
 *   name: Scoring
 *   description: API endpoints for tenant scoring and compatibility checks
 */

/**
 * @swagger
 * /api/scoring/calculate-score:
 *   post:
 *     summary: Calculate tenant score based on provided data
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - income
 *               - creditScore
 *               - employmentHistory
 *             properties:
 *               income:
 *                 type: number
 *                 description: Annual income in dollars
 *               creditScore:
 *                 type: number
 *                 minimum: 300
 *                 maximum: 850
 *                 description: Credit score (300-850)
 *               employmentHistory:
 *                 type: number
 *                 description: Years of employment history
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       description: Overall tenant score (0-100)
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         income:
 *                           type: number
 *                           description: Income score component (0-40)
 *                         creditScore:
 *                           type: number
 *                           description: Credit score component (0-40)
 *                         employmentHistory:
 *                           type: number
 *                           description: Employment history component (0-20)
 *                     recommendation:
 *                       type: string
 *                       enum: [Strong candidate, Moderate candidate, Weak candidate]
 *       400:
 *         description: Missing or invalid input data
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/scoring/check-compatibility:
 *   post:
 *     summary: Check compatibility between tenant and property
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - propertyId
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: ID of the tenant
 *               propertyId:
 *                 type: string
 *                 description: ID of the property
 *     responses:
 *       200:
 *         description: Compatibility check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       description: Compatibility score (0-100)
 *                     factors:
 *                       type: array
 *                       items:
 *                         type: string
 *                         description: Factors affecting compatibility
 *                     recommendation:
 *                       type: string
 *                       enum: [Strong match, Moderate match, Weak match]
 *       400:
 *         description: Missing or invalid input data
 *       404:
 *         description: Tenant or property not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/scoring/check-credit:
 *   get:
 *     summary: Check tenant's credit score
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Credit check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       minimum: 300
 *                       maximum: 850
 *                       description: Credit score (300-850)
 *                     reportDate:
 *                       type: string
 *                       format: date-time
 *                       description: Date of the credit report
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

export {}; 