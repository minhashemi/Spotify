var serviceHost = "https://spotify.minhashemi.workers.dev";
var spotifyUser = "Amin";

var songData;

function updatePlayer() {
    fetch(`${serviceHost}/get-now-playing`)
        .then((response) => response.json())
        .then((data) => {
            // Check if the response contains valid data
            if (!data || !data.type) {
                document.getElementById("player-song").innerHTML = `${spotifyUser} isn't playing anything now.`;
                document.getElementById("player-artist").innerHTML = " ";
                document.getElementById("player-album-art").setAttribute("src", "");
                return;
            }

            // Update the player with song/episode details
            songData = data;

            if (data.type === "track") {
                document.getElementById("player-song").innerHTML = data.name;
                document.getElementById("player-artist").innerHTML = data.artists;
                document.getElementById("player-album-art").setAttribute("src", data.cover_art);

                // Update progress bar
                document.getElementById("player-progress").style.width = `${(data.progress_ms * 100) / data.duration_ms}%`;
            } else if (data.type === "episode") {
                document.getElementById("player-song").innerHTML = data.name;
                document.getElementById("player-artist").innerHTML = data.show_name;
                document.getElementById("player-album-art").setAttribute("src", data.cover_art);

                // Update progress bar
                document.getElementById("player-progress").style.width = `${(data.progress_ms * 100) / data.duration_ms}%`;
            }
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
            document.getElementById("player-song").innerHTML = "Error fetching data.";
        });
}

// Load player for the first time
updatePlayer();
