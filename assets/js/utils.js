const configFullCalendar = {
  navLinks: false,
  editable: false,
  minTime: '7:30:00',
  maxTime: '21:30:00',
  contentHeight: 550,
  header: {
    left: 'prev,next',
    center: 'title',
    right: 'today'
  },
  ignoreTimezone: false,
  timeFormat: 'H:mm[h]',
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
  buttonText: {
    prev: ' < ',
    next: ' > ',
    prevYear: '&nbsp;&lt;&lt;&nbsp;',
    nextYear: '&nbsp;&gt;&gt;&nbsp;',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia'
  },
  dayNames: [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sabado'
  ],
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ],
  monthNamesShort: [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez'
  ]
};

function clickDay(event) {
  const url = event.description?.match(/(https[^"]+)/);

  if (url) {
    window.open(url[1], '_blank');
    return false;
  }
}

function renderDay(info) {
  const a = document.createElement('a');

  a.className = 'fc-day-grid-event fc-h-event fc-event fc-start fc-end';
  a.style.backgroundColor = info.color;
  a.style.borderColor = info.color;
  a.innerHTML = `
      <div class="fc-content">
        ${
          !info.completed && info.hasTime
            ? `<span class="fc-time">${info.start.format('H:mm')}h</span>`
            : ''
        }
        <span class="fc-title">
        ${info.title}
        </span>
      </div>
    `;

  return a;
}

function onChangeMonth(event) {
  const year = event.intervalStart.year();
  const month = (event.intervalStart.month() + 1).toString().padStart(2, '0');

  $.get(
    `https://us-east-1.aws.data.mongodb-api.com/app/flucalendar-noygg/endpoint/getEventsByMonth?year=${year}&month=${month}`,
    res => {
      const json = JSON.parse(res);

      $('#calendar').fullCalendar('removeEventSources');
      $('#calendar').fullCalendar(
        'addEventSource',
        json.data.map(event => ({
          uid: event._id,
          title: getTitle(event),
          color: event.tournament.secondaryColorHex,
          start: event.date,
          end: event.date,
          completed: event.status === 'finished',
          hasTime: event.status === 'finished',
          dtstamp: event.date,
          created: event.date,
          'last-modified': event.date,
          description: `<a href="https://www.sofascore.com/pt/internacional-fluminense/${event.customId}#${event._id}">Ver detalhes</a>`,
          status: 'CONFIRMED',
          transp: 'OPAQUE',
          sequence: 0
        }))
      );
    }
  );
}

function reqTournaments() {
  $.get(
    'https://us-east-1.aws.data.mongodb-api.com/app/flucalendar-noygg/endpoint/getTournaments',
    res => {
      const table = document.querySelector('.legend-bg table');
      const json = JSON.parse(res);
      json.data.forEach(t => {
        const tr = document.createElement('tr');
        const td2 = document.createElement('td');

        tr.innerHTML = `
          <td width="50" align="center" style="background-color:${t.primaryColorHex};border:5px solid ${t.secondaryColorHex};">
            <img width="80" src="https://api.sofascore.app/api/v1/unique-tournament/${t._id}/image" />
          </td>
          <td>${t.name}</td>
        `;

        table.appendChild(tr);
      });
    }
  );
}

function reqMembersCount() {
  $.get(
    'https://us-east-1.aws.data.mongodb-api.com/app/flu-xtcyx/endpoint/getMembersCount',
    res => {
      const members = res;

      var data = [
        {
          x: members.map(m => m.date),
          y: members.map(m => m.total),
          type: 'scatter'
        }
      ];

      Plotly.newPlot(
        'plotly',
        data,
        {
          width: document.body.clientWidth - 50,
          height: document.body.clientHeight / 3,
          margin: {
            l: 80,
            r: 20,
            b: 50,
            t: 50,
            pad: 4
          }
        },
        { displayModeBar: true }
      );
      document.querySelector('.member-bg').firstChild.onclick = e => {
        e.stopPropagation();
      };
    }
  );
}

function getTitle(event) {
  let titleEvent = '';

  if ('score' in event.home && 'score' in event.away) {
    if (event.home.score === event.away.score) {
      titleEvent = '🔘';
    } else if (event.home._id === 1961) {
      titleEvent = event.home.score > event.away.score ? '🟢' : '🔴';
    } else if (event.away._id === 1961) {
      titleEvent = event.away.score > event.home.score ? '🟢' : '🔴';
    }
  }

  const date = new Date(event.date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const c1 = event.tournament.primaryColorHex;
  const c2 = event.tournament.secondaryColorHex;
  const home = getTeamLabel(event.home);
  const away = getTeamLabel(event.away);

  titleEvent = `${titleEvent}${hours}:${minutes}h`;

  return `<div style="background-color:${c1};color:${c2}">${titleEvent}${home}${away}</div>`;
}

function getTeamLabel(team) {
  const attrTitle = document.body.clientWidth < 800 ? 'abbrev' : 'name';
  const labelScore =
    'score' in team ? `<td style="padding-top:8px">(${team.score})</td>` : '';
  const labelName =
    document.body.clientWidth < 555 && labelScore
      ? team[attrTitle].charAt(0)
      : team[attrTitle];

  return `
    <table style="width:auto;line-height:1px;">
      <tr>
        <td><img height="15" src="https://api.sofascore.app/api/v1/team/${team._id}/image/small" onerror="this.src='https://secure.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png&h=40&w=40'"/>
        </td>
        <td style="padding-top:8px">${labelName}</td>
        ${labelScore}
      </tr>
    </table>
  `;
}

function toISOString(date, hour = 0) {
  const newDate = new Date(+date);
  newDate.setHours(newDate.getHours() + hour);

  return newDate.toISOString().replace(/\.[0-9]{3}Z/, 'Z');
}

function toggleLegends() {
  const legends = document.querySelector('.legend-bg');

  if (legends.style.display === 'block') {
    legends.style.removeProperty('display');
  } else {
    legends.style.display = 'block';
  }
}

function toggleMembers() {
  const members = document.querySelector('.member-bg');

  if (members.style.display === 'block') {
    members.style.removeProperty('display');
  } else {
    members.style.display = 'block';
  }
}

/* VIDEOS */

const videoManager = {
  isOpened: false,
  isYouTubeIframeAPI: false,
  url: 'https://us-east-1.aws.data.mongodb-api.com/app/flucalendar-noygg/endpoint/getChannelVideos',
  videosQueue: [],
  currentVideo: null,
  player: null,
  countPlayed: 0
};

// Function called by Youtube Iframe
function onYouTubeIframeAPIReady() {
  videoManager.isYouTubeIframeAPI = true;
}

function loadYouTubeIframeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function reqVideos() {
  return new Promise(resolve => {
    $.get(videoManager.url, res => {
      resolve(JSON.parse(res));
    });
  });
}

function checkPlayer() {
  return new Promise(async resolve => {
    if (!videoManager.player) {
      videoManager.player = new YT.Player('player', {
        width: '80%',
        height: '80%'
      });
      videoManager.player.addEventListener('onStateChange', event => {
        if (event.data === YT.PlayerState.ENDED) {
          videoManager.countPlayed++;
          nextVideo();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      resolve();
    } else {
      resolve();
    }
  });
}

async function checkVideosQueue() {
  if (!videoManager.videosQueue.length) {
    const req = await reqVideos();
    req.data.forEach(video => videoManager.videosQueue.push(video));
  }
}

async function nextVideo() {
  await checkVideosQueue();
  videoManager.currentVideo = videoManager.videosQueue.shift();
  videoManager.player.loadVideoById(videoManager.currentVideo._id);
  setTimeout(() => {
    if (videoManager.isOpened && !videoManager.player.getCurrentTime()) {
      nextVideo();
    }
  }, 3000);
}

async function play() {
  await checkPlayer();
  nextVideo();
}

async function stop() {
  videoManager.player.stopVideo();
}

async function toggleVideos() {
  const videos = document.querySelector('.videos-bg');

  if (videos.style.display === 'flex') {
    videos.style.removeProperty('display');
    videoManager.isOpened = false;
    stop();
  } else {
    videos.style.display = 'flex';
    videoManager.isOpened = true;
    play();
  }
}
