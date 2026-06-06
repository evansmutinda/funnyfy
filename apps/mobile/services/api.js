// API service layer for the Funnyfy mobile app
// Handles styles fetching, subscription sync, job enqueuing, and status polling.
import { Platform } from 'react-native';

export async function fetchStyles(apiBase) {
  const res = await fetch(`${apiBase}/api/styles`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.ok && Array.isArray(data.styles) && data.styles.length > 0) {
    return data.styles.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
    }));
  } else {
    throw new Error('No styles returned');
  }
}

export async function syncSubscription(apiBase, userId, activeEnt, headers) {
  return fetch(`${apiBase}/api/sync-subscription`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId,
      productId: activeEnt.productIdentifier,
      tier: activeEnt.productIdentifier.includes('starter') ? 'starter' :
            activeEnt.productIdentifier.includes('popular') ? 'popular' :
            activeEnt.productIdentifier.includes('pro') ? 'pro' : 'starter',
      expirationDate: activeEnt.expirationDate,
      platform: Platform.OS,
    }),
  });
}

export async function fetchSubscriptionStatus(apiBase, userId, headers) {
  const res = await fetch(`${apiBase}/api/user/subscription?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function enqueueJob(apiBase, userId, styleId, imageUrl, headers) {
  const payload = {
    userId,
    payload: {
      styleId,
      imageUrl: imageUrl || null,
    },
  };

  const res = await fetch(`${apiBase}/api/enqueue`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (parseErr) {
    throw new Error('Server returned invalid response. Please try again.');
  }

  if (!res.ok || !json.ok) {
    const msg = json?.message || json?.error?.error || json?.error || json?.detail || `Request failed with status ${res.status}`;
    throw new Error(String(msg));
  }

  return json; // returns { ok: true, jobId, status: 'pending', queuePosition, estimatedWaitTime }
}

export async function pollJobStatus(apiBase, jobId, headers, onProgress) {
  const terminalStatuses = new Set(['completed', 'failed']);
  const maxAttempts = 40; // 40 * 2s = 80s (failsafe timeout is 90s)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${apiBase}/api/job?id=${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to check job status: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || 'Failed to check job status');
    }

    const job = data.job;
    
    // Call progress callback to update UI with queue position/estimated wait time
    if (onProgress) {
      onProgress(job);
    }

    if (terminalStatuses.has(job.status)) {
      if (job.status === 'completed') {
        // Return structured Replicate output format to match result expectations
        return {
          status: 'succeeded',
          output: job.outputImageUrl
        };
      } else {
        throw new Error(job.errorMessage || 'Image generation failed');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Image generation timed out. Please check My Caricatures later.');
}
