export function getImageUrl(url: string): string {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // If it's a Supabase storage URL with render endpoint, convert it to direct storage URL
    if (parsedUrl.pathname.includes('/storage/v1/render/image/public/')) {
      // Remove transform parameters
      parsedUrl.search = '';
      // Replace render endpoint with object endpoint
      parsedUrl.pathname = parsedUrl.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/');
      return parsedUrl.toString();
    }
    
    return url;
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
} 