/**
 * @swagger
 * tags:
 *   name: Landlords
 *   description: API endpoints for landlord management
 */

/**
 * @swagger
 * /api/landlord/signup:
 *   post:
 *     summary: Register a new landlord
 *     tags: [Landlords]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Landlord created successfully
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /api/landlord/login:
 *   post:
 *     summary: Authenticate a landlord
 *     tags: [Landlords]
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
 *         description: Authentication failed
 */

/**
 * @swagger
 * /api/landlord/profile:
 *   get:
 *     summary: Get landlord profile
 *     tags: [Landlords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *     responses:
 *       200:
 *         description: Landlord profile retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/property:
 *   post:
 *     summary: Add a new property
 *     tags: [Landlords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - price
 *             properties:
 *               address:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/properties/{propertyId}:
 *   put:
 *     summary: Update a property
 *     tags: [Landlords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *       - in: path
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the property to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/properties:
 *   get:
 *     summary: Get all properties owned by the landlord
 *     tags: [Landlords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *     responses:
 *       200:
 *         description: List of properties retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/properties/{propertyId}/applications:
 *   get:
 *     summary: Get applications for a specific property
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *       - in: path
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the property
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   tenantId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [pending, approved, rejected]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/properties/{propertyId}/photos:
 *   post:
 *     summary: Upload photos for a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *       - in: path
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the property
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/landlord/properties/{propertyId}/lease:
 *   put:
 *     summary: Update property lease status
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-supabase-id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supabase ID of the landlord
 *       - in: path
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the property
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLeased
 *             properties:
 *               isLeased:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Property lease status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

export {}; 