import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

// This function maps error codes to their corresponding documentation pages
function getErrorRedirectUrl(code: string): string | null {
  // Convert code to uppercase for consistency
  const upperCode = code.toUpperCase();
  
  // Extract the prefix and number
  const match = upperCode.match(/^([A-Z]+)-(\d+)$/);
  if (!match) return null;
  
  const [, prefix, number] = match;
  
  // Map prefix to the corresponding documentation section
  let section: string;
  switch (prefix) {
    case 'CLI':
      section = 'cli';
      break;
    case 'AUTH':
      section = 'authentication';
      break;
    case 'PROJ':
      section = 'projects';
      break;
    case 'AGENT':
      section = 'agents';
      break;
    case 'DATA':
      section = 'datastores';
      break;
    case 'INT':
      section = 'integration';
      break;
    case 'SYS':
      section = 'system';
      break;
    default:
      return null;
  }
  
  // Format the anchor using just the error code
  const paddedNumber = prefix === 'CLI' ? number.padStart(4, '0') : number.padStart(3, '0');
  
  // Return the full URL path with just the error code as the anchor
  return `/Troubleshooting/error-codes/${section}#${prefix}-${paddedNumber}`;
}

export default async function ErrorRedirect({ params }: { params: { code: string } }) {
  const redirectUrl = getErrorRedirectUrl(params.code);
  
  if (!redirectUrl) {
    // If no matching error code is found, redirect to the error codes index
    return notFound();
  }
  
  // Redirect to the appropriate documentation page
  redirect(redirectUrl);
}
