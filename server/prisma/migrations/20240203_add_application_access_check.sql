-- Create function to check application access
CREATE OR REPLACE FUNCTION public.check_application_access(
  p_application_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_direct_landlord BOOLEAN;
  v_is_property_landlord BOOLEAN;
BEGIN
  -- Check if user is direct landlord of the application
  SELECT EXISTS (
    SELECT 1
    FROM "Application"
    WHERE id = p_application_id
    AND "landlordId" = p_user_id
  ) INTO v_is_direct_landlord;

  IF v_is_direct_landlord THEN
    RETURN TRUE;
  END IF;

  -- Check if user is landlord of the property
  SELECT EXISTS (
    SELECT 1
    FROM "Application" a
    JOIN "Property" p ON a."propertyId" = p.id
    WHERE a.id = p_application_id
    AND p."landlordId" = p_user_id
  ) INTO v_is_property_landlord;

  RETURN v_is_property_landlord;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_application_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_application_access(UUID, UUID) TO service_role; 