const TOURNAMENT_SLUG = "solid-littoral-09-the-return";
const EVENT_SLUG = "utlimate single";
let accessToken = new URL(window.location.href).searchParams.get(
  "access_token"
);
if (accessToken) {
  localStorage.setItem("access_token", accessToken);
} else {
  accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    window.location.href = "/login";
  }
}

// Remove the access token from the URL
window.history.replaceState({}, document.title, "/index.html");

const rootDiv = document.getElementById("matchesRoot");

const tournamentInput = document.getElementById("tournament");
const eventInput = document.getElementById("event");

tournamentInput.value = TOURNAMENT_SLUG;
eventInput.value = EVENT_SLUG;

let currentUser = null;

function submit(e) {
  if (e) e.preventDefault();

  let tournamentSlug = tournamentInput.value;
  let eventSlug = eventInput.value;

  fetchEvent(tournamentSlug, eventSlug, currentUser.player.id).then((event) => {
    console.log(event);
    updateMatchesDisplay(event);
  });
}

/**
 * @param {string} query
 * @param {object} variables
 * @returns {Promise<{data: any}>}
 */
async function fetchGraphql(query, variables) {
  return fetch("https://api.start.gg/gql/alpha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  }).then((res) => res.json());
}

async function getCurrentUser() {
  return fetchGraphql(
    `query CurrentUser {
  currentUser {
    id
    name
    player {
      gamerTag
      prefix
      id
    }
  }
}`,
    {}
  ).then((res) => res.data);
}

async function fetchEvent(tournamentSlug, eventSlug, playerId) {
  let query = await fetchGraphql(
    `query tournamentQuery($tournamentSlug: String, $eventSlug: String, $playerId: ID) {
  tournament(slug: $tournamentSlug) {
    id
    name
    events(filter: {slug: $eventSlug}){
      id
      name
      sets(sortType: CALL_ORDER, filters: {playerIds: [$playerId]}){
        pageInfo {
          total
          totalPages
        }
       nodes {
          id
          startAt
          startedAt
          phaseGroup {
            bracketType
          }
          games {
            selections {
              entrant {
                name
              }
            }
          }
          round
        }
      }
    }
  }
}`,
    { eventSlug, tournamentSlug, playerId: playerId }
  );
  if (query.errors) {
    console.error(query.errors);
    return;
  }

  let tournament = query.data.tournament;
  if (tournament.events.length == 0) {
    console.error("No events");
    return;
  }
  let event = tournament.events[0];
  document.getElementById(
    "lastQuery"
  ).innerText = `Last query at ${new Date().toLocaleTimeString()}`;
  console.log(event);
  return event;
}

function updateMatchesDisplay(event) {
  rootDiv.innerHTML = "";

  if (event.sets.nodes.length == 0) {
    let p = document.createElement("p");
    p.innerText = "no next match";
    rootDiv.appendChild(p);
    return;
  }

  for (event in event.sets.nodes) {
    let div = document.createElement("div");
    let p = document.createElement("p");
    p.innerText = `startAt: ${event.startAt} startedAt: ${event.startedAt}\n phaseGroup: ${event.phaseGroup.bracketType} round: ${event.round}`;
    let p2 = document.createElement("p");
    p2.innerText = `player1: ${event.games.selections[0].entrant.name} player2: ${event.games.selections[1].entrant.name}`;
    div.appendChild(p);
    div.appendChild(p2);
    rootDiv.appendChild(div);
  }
}

async function main() {
  let user = await getCurrentUser();
  console.log(user.currentUser);

  currentUser = user.currentUser;

  document.getElementById("userId").innerText = `Id: ${currentUser.id}`;
  document.getElementById(
    "playerId"
  ).innerText = `Player Id: ${currentUser.player.id}`;
  document.getElementById(
    "playerName"
  ).innerText = `Player Name: [${currentUser.player.prefix}] ${currentUser.player.gamerTag}`;

  document.getElementById("form").addEventListener("submit", submit);

  submit();
}
main();
