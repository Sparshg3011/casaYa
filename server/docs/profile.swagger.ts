/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: API endpoints for managing tenant and landlord profiles
 */

/**
 * @swagger
 * /api/profile/tenant:
 *   put:
 *     summary: Update tenant profile
 *     tags: [Profiles]
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
 *               ssn:
 *                 type: string
 *                 pattern: '^[0-9]{9}$'
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               currentAddress:
 *                 type: string
 *               occupation:
 *                 type: string
 *               income:
 *                 type: number
 *               preferredMoveInDate:
 *                 type: string
 *                 format: date
 *               bio:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *               facebookUrl:
 *                 type: string
 *               instagramUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         occupation:
 *                           type: string
 *                         income:
 *                           type: number
 *                         preferredMoveInDate:
 *                           type: string
 *                           format: date
 *                         bio:
 *                           type: string
 *                         socialLinks:
 *                           type: object
 *                           properties:
 *                             linkedin:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             instagram:
 *                               type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         occupation:
 *                           type: string
 *                         income:
 *                           type: number
 *                         preferredMoveInDate:
 *                           type: string
 *                           format: date
 *                         bio:
 *                           type: string
 *                         socialLinks:
 *                           type: object
 *                           properties:
 *                             linkedin:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             instagram:
 *                               type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/profile/landlord:
 *   put:
 *     summary: Update landlord profile
 *     tags: [Profiles]
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
 *               companyName:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               bio:
 *                 type: string
 *               yearsOfExperience:
 *                 type: number
 *               linkedinUrl:
 *                 type: string
 *               facebookUrl:
 *                 type: string
 *               instagramUrl:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         companyName:
 *                           type: string
 *                         businessAddress:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         yearsOfExperience:
 *                           type: number
 *                         socialLinks:
 *                           type: object
 *                           properties:
 *                             linkedin:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             instagram:
 *                               type: string
 *                             website:
 *                               type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Landlord not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get landlord profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         companyName:
 *                           type: string
 *                         businessAddress:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         yearsOfExperience:
 *                           type: number
 *                         socialLinks:
 *                           type: object
 *                           properties:
 *                             linkedin:
 *                               type: string
 *                             facebook:
 *                               type: string
 *                             instagram:
 *                               type: string
 *                             website:
 *                               type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Landlord not found
 *       500:
 *         description: Server error
 */

export {}; 