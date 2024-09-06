// ! CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN are environment variables defined in Cloudflare

addEventListener("fetch", (event) => {
  const { pathname } = new URL(event.request.url);
  const endpoint = pathname.slice(1); 

  if (endpoint === "test") {
    event.respondWith(greetUser(event.request));
  } else if (endpoint === "authorize") {
    event.respondWith(initiateAuthFlow(event.request));
  } else if (endpoint === "callback") {
    event.respondWith(processAuthCallback(event.request));
  } else if (endpoint === "get-now-playing") {
    event.respondWith(retrieveCurrentlyPlaying(event.request));
  } else {
    event.respondWith(new Response("ERROR: Unsupported request."));
  }
});

async function greetUser(request) {
  return new Response("Middleware setup successful!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

async function initiateAuthFlow(request) {
  const stateToken = "SPOTIFY_WIDGET_STATE"; 
  const currentUrl = new URL(request.url);
  const redirectUri = `${currentUrl.origin}/callback`;
  const requiredScope = "user-read-currently-playing";

  const authQueryParams = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: requiredScope,
    redirect_uri: redirectUri,
    state: stateToken,
  }).toString();

  return Response.redirect(
    `https://accounts.spotify.com/authorize?${authQueryParams}`,
    302
  );
}

async function processAuthCallback(request) {
  const callbackUrl = new URL(request.url);
  const receivedCode = callbackUrl.searchParams.get("code");
  const receivedState = callbackUrl.searchParams.get("state");
  if (receivedState === "SPOTIFY_WIDGET_STATE") {
    const tokenExchangeResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: receivedCode,
          redirect_uri: `${callbackUrl.origin}/callback`,
          grant_type: "authorization_code",
        }).toString(),
      }
    );

    if (tokenExchangeResponse.ok) {
      const tokenData = await tokenExchangeResponse.json();
      return new Response(`Your REFRESH_TOKEN is: ${tokenData.refresh_token}`);
    } else {
      return new Response("Authorization failed. Please try again.");
    }
  } else {
    return new Response("State mismatch. Please retry authorization.");
  }
}

async function retrieveCurrentlyPlaying(request) {
  // Obtain a new access token each time
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }).toString(),
  });

  const { access_token } = await tokenResponse.json();

  const nowPlayingResponse = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  let trackInfo = await nowPlayingResponse.text();

  // Handle empty response
  if (!trackInfo) {
    trackInfo = { ERROR: "No track information available." };
  } else {
    trackInfo = JSON.parse(trackInfo);
  }

  // CORS headers to allow cross-origin access
  const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Max-Age": "86400",
  };

  return new Response(JSON.stringify(trackInfo, null, 2), {
    headers: responseHeaders,
  });
}