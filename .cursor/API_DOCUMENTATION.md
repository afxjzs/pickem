# List of NFL API Endpoints

This page has been updated a lot in the past 3 years. **Older revisions you might like more than this one:**

- [**June 2021**](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/b99b9e0d2df72470fa622e2f76cecb0362111e9a) - list of endpoints for other sports/leagues (i.e. nba, nhl, mlb)
- [**August 2021**](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/9daed3db02cc2661e63ea08741c6053c5aef28ce#league-history---get-all-historical-data) - get historical fantasy league data
- [**September 2021**](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/2fa98612cedcbad033d4206b16cd360c9b654ae9#file-source-txt) - list of endpoints in plain text
- [**May 2023**](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/cd7462cd365e516d7499b43f027db4b8b1a2d6c0) - collapsed endpoint response examples
- [**Mar 2025**](https://gist.githubusercontent.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/raw/5e2ba150912691a56c86097303784aa2ff843a6c/new.md) - endpoints from partners.api.espn.com **\*NEW\***

**Additional Resources**

- [nfl-nerd](https://github.com/nntrn/nfl-nerd) ([api](https://raw.githubusercontent.com/nntrn/nfl-nerd/master/src/api.js))
- [espn-wiki](https://github.com/nntrn/espn-wiki/wiki) :star:
- [ESPN's hidden API endpoints](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [Using ESPN's new Fantasy API (v3)](https://stmorse.github.io/journal/espn-fantasy-v3.html)
- [ESPN: Get Endpoint (CRAN Package)](https://cran.r-project.org/web/packages/ffscrapr/vignettes/espn_getendpoint.html)

**Notes**

- This page is limited to NFL endpoints but can be refashioned for other leagues (i.e. `/sports/football/leagues/nfl/` => `/sports/baseball/leagues/mlb/`)  
  **List of ESPN leagues**: [API](https://sports.core.api.espn.com/v2/sports) | [Document](https://gist.githubusercontent.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/raw/5e0b844e4d56d0b049747024a04bb7949c2d6c5d/extending-espn-api.md)

**Paramaters**

- **{YEAR}**: Football season (`YYYY`)
- **{SEASONTYPE}**: 1=pre, 2=regular, 3=post, 4=off
- **{EVENT_ID}**: game id
- **{TEAM_ID}**: 1-32 ([view all](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams))
- **{ATHLETE_ID}**: [view all](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes?limit=1000&active=true)
- **{FANTASY_LEAGUE_ID}**: Fantasy league id
- **{BET_PROVIDER_ID}**: [view all](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/providers?limit=100)

## Table of Contents

- [List of NFL API Endpoints](#list-of-nfl-api-endpoints)
	- [Table of Contents](#table-of-contents)
	- [Reference List](#reference-list)
	- [News](#news)
	- [Detailed](#detailed)
	- [Teams](#teams)
	- [Games](#games)
	- [Athletes](#athletes)
	- [Calendar](#calendar)
	- [Odds](#odds)
	- [Scoreboard](#scoreboard)
	- [Leagues](#leagues)
	- [Search](#search)
	- [Pick em challenges](#pick-em-challenges)
	- [Fantasy](#fantasy)
		- [Curl Fantasy Filters](#curl-fantasy-filters)
		- [Fantasy Stats](#fantasy-stats)
	- [Endpoints](#endpoints)
		- [Athlete endpoints](#athlete-endpoints)
		- [Calendar endpoints](#calendar-endpoints)
		- [Season endpoints](#season-endpoints)
		- [Betting endpoints](#betting-endpoints)
		- [Metainfo endpoints](#metainfo-endpoints)
		- [Team endpoints](#team-endpoints)
		- [Fantasy endpoints](#fantasy-endpoints)

## Reference List

Get list of ids

- **Events**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates={YEAR}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=2023)

  Filter: [&seasontype=2&week=1] | [&seasontype=2]

  [&seasontype=2&week=1]: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2023&seasontype=2&week=1
  [&seasontype=2]: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=2021&seasontype=2

- **Athletes**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes?limit=1000&active=true](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes?limit=1000&active=true)

- **Team**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams?limit=32](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams?limit=32)

- **Positions**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/positions?limit=75](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/positions?limit=75)

- **Venues**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/venues?limit=700](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/venues?limit=700)

- **Leaders**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders?limit=100](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders?limit=100)

- **Seasons**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons?limit=100](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons?limit=100)

- **Franchises**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises?limit=50](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises?limit=50)

- **News**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50](https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50)

- **Team News** (limit is incompatible with team filter):  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/news?team={TEAM_ID}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=10)

## News

- **NFL news**  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50](https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50)

- **news with api links to event**  
  [now.core.api.espn.com/v1/sports/news?limit=1000&sport=football](https://now.core.api.espn.com/v1/sports/news?limit=1000&sport=football)

- :star: **news using playerId** [[view]][e1]  
  [site.api.espn.com/apis/fantasy/v2/games/ffl/news/players?limit=50&playerId={ATHLETE_ID}](https://site.api.espn.com/apis/fantasy/v2/games/ffl/news/players?limit=50&playerId=2977187)

  [e1]: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c?permalink_comment_id=5200643#gistcomment-5200643

- **Search query** - max limit 100 [[view]][e2]  
  [site.web.api.espn.com/apis/search/v2?limit=100&query={SEARCH_TERM}](https://site.web.api.espn.com/apis/search/v2?query=kupp&limit=100)

  [e2]: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c?permalink_comment_id=5200298#gistcomment-5200298

- **Team news**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/news?team={TEAM_ID}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=10)

- **Contributor news**:  
  [site.web.api.espn.com/apis/v2/flex?contributor=adam-schefter&limit=100&pubkey=contributor-page](https://site.web.api.espn.com/apis/v2/flex?contributor=adam-schefter&limit=100&pubkey=contributor-page)

## Detailed

Get live updates (xhr=1)

- **Scoreboard**: [cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50](https://cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50)

- **Schedule**: [cdn.espn.com/core/nfl/schedule?xhr=1&year={YEAR}&week={WEEK_NUM}](https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2020&week=2)

- **Standings**: [cdn.espn.com/core/nfl/standings?xhr=1](https://cdn.espn.com/core/nfl/standings?xhr=1)

- **Boxscore**: [cdn.espn.com/core/nfl/boxscore?xhr=1&gameId={EVENT_ID}](https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=401220225)

- **Recap**: [cdn.espn.com/core/nfl/recap?xhr=1&gameId={EVENT_ID}](https://cdn.espn.com/core/nfl/recap?xhr=1&gameId=401220225)

- **Plays**: [cdn.espn.com/core/nfl/playbyplay?xhr=1&gameId={EVENT_ID}](https://cdn.espn.com/core/nfl/playbyplay?xhr=1&gameId=401220225)

- **Game**: [cdn.espn.com/core/nfl/game?xhr=1&gameId={EVENT_ID}](https://cdn.espn.com/core/nfl/game?xhr=1&gameId=401127922)

- **Matchup**: [cdn.espn.com/core/nfl/matchup?xhr=1&gameId={EVENT_ID}](https://cdn.espn.com/core/nfl/matchup?xhr=1&gameId=401220225)

## Teams

- **Athletes**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{TEAM_ID}/athletes?limit=200](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2023/teams/18/athletes?limit=200)

- **Team Events**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{TEAM_ID}/events](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/18/events)

- **List of NFL Teams (with id,logo,name)**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/teams](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams)

- **Team**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/1)

- **Teams (Season)**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams)

- **Team (season)**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{TEAM_ID}](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/24)

- **Current Leaders**:  
  [site.web.api.espn.com/apis/site/v3/sports/football/nfl/teamleaders](https://site.web.api.espn.com/apis/site/v3/sports/football/nfl/teamleaders)

- **Season Leaders**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/leaders](http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/leaders)

- **Record**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/teams/{TEAM_ID}/record](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/types/2/teams/6/record)

- **Depthcharts**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{TEAM_ID}/depthcharts](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/24/depthcharts)

- **Roster**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}/roster](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/4/roster)

- :star: **Detailed Roster**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}?**enable=roster,projection,stats**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/4?enable=roster,projection,stats)
- **Schedule**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}/schedule](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/4/schedule)[`?season=`{YEAR}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/4/schedule?season=2019)

- **Injuries**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/{TEAM_ID}/injuries](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/8/injuries?limit=100)

- **Statistics**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/teams/{TEAM_ID}/statistics](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/24/statistics)

- **Past performance**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/{TEAM_ID}/odds/{BET_PROVIDER_ID}/past-performances?limit=140](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/8/odds/1002/past-performances?limit=140)

- **Projection** (not valid for past seasons):  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2023/teams/{TEAM_ID}/projection](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2023/teams/23/projection)

- **Season standing**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/groups/{CONFERENCE_ID}/standings](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/8/standings)

  [AFC](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/8/standings) (CONFERENCE_ID=8)  
  [NFC](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/7/standings) (CONFERENCE_ID=7)

## Games

- :star: **Summary**:  
  1 => [site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={EVENT_ID}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401326315)  
  2 => [site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={EVENT_ID}](https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401671808)

- **Events**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events

- **Play by Plays**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/plays?limit=300](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/plays?limit=300)

- **Get events with plays**:  
  [site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=YYYYMMDD-YYYYMMDD&pbpOnly=true](https://site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=20200901-20210228&pbpOnly=true)

- **Drives**:  
  plays, drive start/end times, and total offensive plays  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/drives](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401548411/competitions/401548411/drives)

- **Play probabilities**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/probabilities?limit=300](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/probabilities?limit=300)

- **Linescores**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/competitors/{TEAM_ID}/linescores](http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437932/competitions/401437932/competitors/6/linescores)

- **Records**:  
  Record Year To Date as of Event (wins, losses, streaks, etc)  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/competitors/{TEAM_ID}/records](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401548411/competitions/401548411/competitors/10/records)

- **Scoring & All Splits**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/competitors/{TEAM_ID}/statistics](http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437932/competitions/401437932/competitors/6/statistics)

- **Roster (get starters)**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/competitors/{TEAM_ID}/roster](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220225/competitions/401220225/competitors/12/roster)

- **Weekly talent picks**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/weeks/{WEEK_NUM}/talentpicks?limit=100](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2020/types/2/weeks/6/talentpicks?limit=100)

- **Weekly event ids**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/weeks/{WEEK_NUM}/events](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/1/events)

- **QBR Weekly/Game stats**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/weeks/{WEEK_NUM}/qbr/10000?limit=100](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2020/types/2/weeks/6/qbr/10000?limit=100)

- **Game officials/judges**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/officials](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437954/competitions/401437954/officials)

- **Expected margin of victory & predicted win percentage**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/powerindex/{TEAM_ID}](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437954/competitions/401437954/powerindex/30)

## Athletes

- :star: **Splits**:  
  [site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ATHLETE_ID}/splits](https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/splits)

- **Get all active player ids**:  
  https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true

- **Player stats for event**:

  - **Eventlog**:  
    [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/athletes/{ATHLETE_ID}/eventlog](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/athletes/14876/eventlog)

  - **Event stats**:  
    [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/competitors/{TEAM_ID}/roster/{ATHLETE_ID}/statistics/0](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437640/competitions/401437640/competitors/10/roster/14876/statistics/0)

- **Current leaders**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders

- **Leaders (year)**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/leaders](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/leaders)

- **Talent picks**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/talentpicks

- :star: **Gamelog**:  
  [site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ATHLETE_ID}/gamelog](https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/gamelog)

- **Coaches**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/coaches?limit=50](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/coaches?limit=50)

- **Athletes v2**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes

- **Athletes v3**:  
  https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=1000

- **Player stats for each game**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/athletes/{ATHLETE_ID}/eventlog](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/athletes/14876/eventlog)

- **statisticslog**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/{ATHLETE_ID}/statisticslog](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/2576336/statisticslog)

- :star: **Athlete Overview**:  
  [site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ATHLETE_ID}/overview](https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/overview)

- **Free agents**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/freeagents](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/freeagents)

- **Draft**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/draft](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/draft)

- **Draft rounds**:  
  [site.web.api.espn.com/apis/v2/scoreboard/header?draft_year={YEAR}&draft_round=1](https://site.web.api.espn.com/apis/v2/scoreboard/header?draft_year=2023&draft_round=1)

## Calendar

- **Get all Monday games**:  
  https://site.api.espn.com/apis/site/v2/mondaynightfootball

- **Get all Thursday games**:  
  https://site.api.espn.com/apis/site/v2/thursdaynightfootball

- **Get all Sunday games**:  
  https://site.api.espn.com/apis/site/v2/sundaynightfootball

- **Ondays**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/ondays

- **Offdays**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/offdays

- **Blacklist**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/blacklist

- **Whitelist dates**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/whitelist

- **Weeks**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/weeks](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks)

- **Rankings, events, and talentpicks for week**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/weeks/{WEEKNUM}](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/1)

- **Season**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021)

## Odds

- https://site.web.api.espn.com/apis/v3/sports/football/nfl/odds

- **Win probabilities**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/probabilities?limit=200](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/probabilities?limit=200)

- **Odds**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/odds](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/odds)

- **Matchup Quality & Game Projection**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/predictor](http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437932/competitions/401437932/predictor)

- **Against-the-spread**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/2/teams/{TEAM_ID}/ats](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2020/types/2/teams/26/ats)

- **Futures**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/futures](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2020/futures)

- **Head-to-head (game)**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/odds/{BET_PROVIDER_ID}/head-to-heads](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/odds/1002/head-to-heads)

- **Odds records**: (might encounter errors with older years)  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/0/teams/{TEAM_ID}/odds-records](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/types/0/teams/4/odds-records)

- **Game odds**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{EVENT_ID}/competitions/{EVENT_ID}/odds/{BET_PROVIDER_ID}/history/0/movement?limit=100](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/odds/1002/history/0/movement?limit=100)

- **QBR Weekly/Game stats**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/2/weeks/{WEEK_NUM}/qbr/10000](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2020/types/2/weeks/6/qbr/10000)

- **Past performances**: get spread, over/under odds, moneyline  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/{TEAM_ID}/odds/{BET_PROVIDER_ID}/past-performances?limit=200](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/10/odds/1002/past-performances?limit=200)

## Scoreboard

- **Day**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=**YYYYMMDD**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20181213)

- **Week**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=**YYYY**&seasontype={SEASONTYPE}&week={WEEKNUM}](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2018&seasontype=2&week=1)

- **Year**:  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=**YYYY**&seasontype=2](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2018&seasontype=2)

- **Range** (cannot be more than 13 months):  
  [site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=**YYYYMMDD-YYYYMMDD**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=20200901-20210228)

  ***

  **Examples**:  
  site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard

  - [?dates=**2022**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=2022)
  - [?dates=**2022**&seasontype=**2**&week=**1**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2022&seasontype=2&week=1)
  - [?dates=**20200901-20210228**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20200901-20210228)
  - [?dates=**20200901**](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20200901)

## Leagues

- **Transactions**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/transactions

- **Groups**:  
  [sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/types/{SEASONTYPE}/groups](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/4/groups)

- **Franchises**:  
  https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises

- **Header**:  
  https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl

## Search

- https://site.web.api.espn.com/apis/common/v3/search?query=nfl&limit=5&mode=prefix
- https://site.web.api.espn.com/apis/common/v3/search

## Pick em challenges

> Parameters
>
> - {USER_GAME_ID}
> - {GROUP_ID}
> - {CHALLENGE_ID} and {CHALLENGE_NAME}
> - {VIEW_NAME}
>   - :star: allon
>   - :star: chui_default
>   - chui_default_group
>   - chui_default_groupParticipationHistory
>   - chui_default_metadata
>   - chui_pagetype_group_picks
>   - pagetype_leaderboard

- **Challenges**:  
  https://gambit-api.fantasy.espn.com/apis/v1/challenges

- **Scoring**:  
  [gambit-api.fantasy.espn.com/apis/v1/challenges/{CHALLENGE_NAME}?scoringPeriodId={WEEKNUM}&view={VIEW_NAME}](https://gambit-api.fantasy.espn.com/apis/v1/challenges/nfl-pigskin-pickem-2023?scoringPeriodId=3&platform=chui&view=allon)

- **Group**:  
  [gambit-api.fantasy.espn.com/apis/v1/challenges/{CHALLENGE_NAME}/groups/{GROUP_ID}?view={VIEW_NAME}](https://gambit-api.fantasy.espn.com/apis/v1/challenges/nfl-win-totals-2023/groups/3ea0845b-59d5-499b-97a0-2eb9d02e1cc9?view=allon&platform=chui)

- :star: **User**  
  [gambit-api.fantasy.espn.com/apis/v1/challenges/{CHALLENGE_NAME}/entries/{USER_GAME_ID}?view={VIEW_NAME}](https://gambit-api.fantasy.espn.com/apis/v1/challenges/nfl-pigskin-pickem-2023/entries/ac079fc0-4d4f-11ee-96d2-37e637e51967?platform=chui&view=chui_default)

- **Leaderboard**:  
  [gambit-api.fantasy.espn.com/apis/v1/challenges/{CHALLENGE_NAME}/leaderboard?view={VIEW_NAME}](https://gambit-api.fantasy.espn.com/apis/v1/challenges/nfl-pigskin-pickem-2023/leaderboard?view=pagetype_leaderboard&platform=chui)

- **Propositions**:  
  [gambit-api.fantasy.espn.com/apis/v1/propositions?challengeId={CHALLENGE_ID}&view={VIEW_NAME}](https://gambit-api.fantasy.espn.com/apis/v1/propositions?challengeId=230&platform=chui&view=chui_default)

## Fantasy

> **v3 header:**  
> `X-Fantasy-Filter: {"players":{"limit":2000},"filterActive":{"value":true}}`

- **Current season**:  
  https://fantasy.espn.com/apis/v3/games/ffl

* **Players**:  
  https://fantasy.espn.com/apis/v3/games/ffl/seasons/2023/players?view=players_wl

  - [&view=mTeam&view=mRoster&view=mMatchup&view=mSettings](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2019/players?view=mTeam&view=mRoster&view=mMatchup&view=mSettings)

* **Private league**:  
  [fantasy.espn.com/apis/v3/games/ffl/seasons/{YEAR}/segments/0/leagues/{FANTASY_LEAGUE_ID}](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2019/segments/0/leagues/1241838?view=mDraftDetail&view=mLiveScoring&view=mMatchupScore&view=mPendingTransactions&view=mPositionalRatings&view=mSettings&view=mTeam&view=modular&view=mRoster)

  - season < 2018: [fantasy.espn.com/apis/v3/games/ffl/leagueHistory/{FANTASY_LEAGUE_ID}?seasonId={YEAR}](https://fantasy.espn.com/apis/v3/games/ffl/leagueHistory/1241838?seasonId=2018&view=mDraftDetail&view=mLiveScoring&view=mMatchupScore&view=mPendingTransactions&view=mPositionalRatings&view=mSettings&view=mTeam&view=modular&view=mRoster)

  - season > 2018: [fantasy.espn.com/apis/v3/games/ffl/seasons/{YEAR}/segments/0/leagues/{FANTASY_LEAGUE_ID}](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2019/segments/0/leagues/1241838?view=mDraftDetail&view=mLiveScoring&view=mMatchupScore&view=mPendingTransactions&view=mPositionalRatings&view=mSettings&view=mTeam&view=modular&view=mRoster)

- **Games (v2)**:  
  [site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=**YYYYMMDD**](https://site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=20210913&pbpOnly=true)
  - [dates=**YYYYMMDD-YYYYMMDD**](https://site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=20210901-20211108)

### Curl Fantasy Filters

- **Get % owned for players**:  
  [fantasy.espn.com/apis/v3/games/ffl/seasons/{YEAR}/players?scoringPeriodId=0&view=players_wl](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2023/players?scoringPeriodId=0&view=players_wl)

  ```sh
  curl -H 'X-Fantasy-Filter: {"filterActive":{"value":true}}' <URL>
  ```

  `X-Fantasy-Filter` is required in the request header to get all active players.  
  Omitting this returns only 50 items

  ***

- :star: **Get player info**:  
  [fantasy.espn.com/apis/v3/games/ffl/seasons/{YEAR}/segments/0/leaguedefaults/{PPR_ID}?view=kona_player_info](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2023/segments/0/leaguedefaults/3?view=kona_player_info)

  ```sh
  curl -H 'X-Fantasy-Filter: {"players":{"limit":2000,"sortPercOwned":{"sortPriority":4,"sortAsc":false}}}' <URL>
  ```

  - `sortPercOwned` is required with `limit`
  - `PPR_ID` can be 1, 3, or 4.

  ***

- **Get bye week for all teams**:  
  [fantasy.espn.com/apis/v3/games/ffl/seasons/{YEAR}?view=proTeamSchedules_wl](https://fantasy.espn.com/apis/v3/games/ffl/seasons/2023?view=proTeamSchedules_wl)

  ```sh
  jq '.settings.proTeams|map({name,byeWeek})'
  ```

### Fantasy Stats

- **Position**

  ```json
  { "1": "QB",
    "2": "RB",
    "3": "WR",
    "4": "TE",
    "5": "K",
   "16": "DST" }
  ```

- **Player stats**  
  [View](https://gist.githubusercontent.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c/raw/5e2ba150912691a56c86097303784aa2ff843a6c/new.md)

## Endpoints

### Athlete endpoints

- https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=7000
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/bio
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/gamelog :star:
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/news
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/overview
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/results
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/scorecards
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/splits
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/stats
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/14876/vsathlete
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byathlete
- https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byteam
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes?limit=1000
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/14876
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/14876/statistics/0
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/14876/statisticslog
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/athletes/14876/notes
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/athletes/14876/projections
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/athletes/14876/statistics
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/athletes/14876/statistics/0
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2022/athletes/14876/eventlog
- https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?page=1&limit=20000

### Calendar endpoints

Blacklist dates, whitelist dates, events

- https://site.web.api.espn.com/apis/fantasy/v2/games/ffl/games?dates=20200901-20210228&pbpOnly=true
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/blacklist
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/calendar/whitelist
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326315
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326315/competitions/401326315

### Season endpoints

Game weeks, Season types, weekly events, weekly picks

- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/coaches/4408695
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/athletes
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/athletes/14876
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/coaches?limit=50
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/draft
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/futures
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/futures/1561
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/1
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/leaders
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/6
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/6/events
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/6/qbr/10000

### Betting endpoints

Betting, odds, draft

- https://site.web.api.espn.com/apis/v3/sports/football/nfl/odds
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/competitors/34/roster
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/odds
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/plays?limit=400
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/probabilities?limit=200
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401249063/competitions/401249063/plays/4012490631
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326315/competitions/401326315/odds/1003
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326315/competitions/401326315/odds/1003/predictors
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326315/competitions/401326315/probabilities/4012490631
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/draft/athletes?limit=500
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/draft/rounds
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/draft/status
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/6/talentpicks

### Metainfo endpoints

Franchise, news, venues

- https://site.api.espn.com/apis/site/v2/sports/football/nfl/news
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
- https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders?season=2021
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises/1
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders/0
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/positions?limit=100
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/positions/8
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/providers/1003
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/1/standings
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/groups/1/teams
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/talentpicks
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/venues/3493

### Team endpoints

Depthcharts, injuries, coaches, roster, odds records

- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/roster
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/schedule
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/34?enable=projection
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/34?enable=roster
- https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/34?enable=stats
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12/athletes
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12/coaches/17553
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12/depthcharts
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12/events
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/teams/12/projection
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/ats
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/attendance
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/leaders
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/odds-records
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/record
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/statistics
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/teams/12/statistics/0
- https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/12/injuries

### Fantasy endpoints

- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025?view=allon
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024?view=chui_default_platformsettings
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players?scoringPeriodId=2&view=chui_default_platformsettings
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players?view=kona_player_info
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players?view=players_wl
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/1/leaguedefaults/3?scoringPeriodId=0&view=kona_player_info
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024?view=chui_default_admin_group
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024?view=chui_default_dashboard
- https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024?view=chui_default_platformsettingsNFase here