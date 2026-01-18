/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: API endpoints for tenant management
 */

/**
 * @swagger
 * /api/tenant/signup:
 *   post:
 *     summary: Register a new tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant registered successfully
 *       400:
 *         description: Invalid input or email already registered
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tenant/login:
 *   post:
 *     summary: Authenticate tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tenant/profile:
 *   get:
 *     summary: Get tenant profile
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update tenant profile
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *               occupation:
 *                 type: string
 *               income:
 *                 type: number
 *               preferredMoveInDate:
 *                 type: string
 *                 format: date
 *               linkedinUrl:
 *                 type: string
 *               facebookUrl:
 *                 type: string
 *               instagramUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tenant/properties:
 *   get:
 *     summary: Get all available properties
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   location:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   landlordId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [available, rented, pending]
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tenant/properties/search:
 *   get:
 *     summary: Search available properties
 *     tags: [Tenants]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tenant/properties/filter:
 *   get:
 *     summary: Filter properties based on criteria
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to filter by
 *     responses:
 *       200:
 *         description: Filtered list of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: number
 *                   location:
 *                     type: string
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/tenant/applications:
 *   post:
 *     summary: Submit rental application
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - moveInDate
 *             properties:
 *               propertyId:
 *                 type: string
 *               moveInDate:
 *                 type: string
 *                 format: date
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get tenant's applications
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tenant/favorites:
 *   post:
 *     summary: Add a property to favorites
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property added to favorites successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/tenant/favorites/{propertyId}:
 *   delete:
 *     summary: Remove a property from favorites
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the tenant
 *       - in: path
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the property to remove from favorites
 *     responses:
 *       200:
 *         description: Property removed from favorites successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/tenant/verify/status:
 *   get:
 *     summary: Get tenant verification status
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the tenant
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/tenant/verify/plaid/sandbox-token:
 *   post:
 *     summary: Get a Plaid sandbox public token
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the tenant
 *     responses:
 *       200:
 *         description: Sandbox token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicToken:
 *                   type: string
 *       400:
 *         description: Bad request
 */

export {}; 