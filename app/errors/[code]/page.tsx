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
  
  // Format the anchor based on the error code format
  // For CLI errors, the format is cli-0001-failed-to-delete-agents
  // For other errors, the format is auth-001-invalid-credentials
  const paddedNumber = prefix === 'CLI' ? number.padStart(4, '0') : number.padStart(3, '0');
  
  // Return the full URL path
  return `/Troubleshooting/error-codes/${section}#${section.toLowerCase()}-${paddedNumber.toLowerCase()}`;
}

export default function ErrorRedirect({ params }: { params: { code: string } }) {
  const { code } = params;
  const redirectUrl = getErrorRedirectUrl(code);
  
  if (!redirectUrl) {
    // If no matching error code is found, redirect to the error codes index
    return notFound();
  }
  
  // Redirect to the appropriate documentation page
  redirect(redirectUrl);
}
