import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

// Helper function to get heading suffix based on error code
function getHeadingSuffix(prefix: string, number: string): string {
  // Map common error codes to their title slugs
  const errorTitles: Record<string, Record<string, string>> = {
    'CLI': {
      '0001': 'failed-to-delete-agents',
      '0002': 'failed-to-create-project',
      '0003': 'unable-to-authenticate-user',
      '0004': 'environment-variables-not-set',
      '0005': 'api-request-failed',
      // Add more as needed
    },
    'AUTH': {
      '001': 'invalid-credentials',
      '002': 'token-expired',
      '003': 'invalid-token',
      // Add more as needed
    },
    // Add more prefixes as needed
  };
  
  // Return the known title suffix if available, otherwise use a generic fallback
  return errorTitles[prefix]?.[number] || 'error';
}

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
  
  // Format the anchor using lowercase error code format (standard MDX heading ID generation)
  const paddedNumber = prefix === 'CLI' ? number.padStart(4, '0') : number.padStart(3, '0');
  
  // Return the full URL path with standard MDX heading ID format
  return `/Troubleshooting/error-codes/${section}#${prefix.toLowerCase()}-${paddedNumber}-${getHeadingSuffix(prefix, paddedNumber)}`;
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
