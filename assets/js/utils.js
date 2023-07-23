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

/* PLAYER */

const playerManager = {
  url: 'https://us-east-1.aws.data.mongodb-api.com/app/flucalendar-noygg/endpoint/getChannelVideos',
  videosQueue: [],
  livesQueue: [],
  shortsQueue: [],
  isOpened: false,
  isYouTubeIframeAPI: false,
  currentItem: null,
  player: null,
  countPlayed: 0,
  channelInfoElem: null,
  videoInfoElem: null,
  typeIndex: 0,
  types: ['short', 'video', 'short', 'live']
};

// Function called by Youtube Iframe
function onYouTubeIframeAPIReady() {
  playerManager.isYouTubeIframeAPI = true;
}

function loadYouTubeIframeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  playerManager.channelInfoElem = document.querySelector('.channel-info');
  playerManager.videoInfoElem = document.querySelector('.video-title');
}

function reqVideos(type) {
  return new Promise(resolve => {
    $.get(`${playerManager.url}?type=${type}`, res => {
      resolve(JSON.parse(res));
    });
  });
}

function checkMobileAndTablet() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function checkPlayer() {
  return new Promise(async resolve => {
    if (!playerManager.player) {
      playerManager.player = new YT.Player('player', {
        width: '70%',
        height: '60%'
      });
      playerManager.player.addEventListener('onStateChange', event => {
        if (event.data === YT.PlayerState.ENDED) {
          playerManager.countPlayed++;
          nextVideo();
        }
      });
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (playerManager.player.loadVideoById) {
          break;
        }
      }
      if (checkMobileAndTablet()) {
        playerManager.player.mute();
      }
      resolve();
    } else {
      resolve();
    }
  });
}

async function checkVideosQueue() {
  if (!playerManager.videosQueue.length) {
    const req = await reqVideos('video');
    req.data.forEach(video => playerManager.videosQueue.push(video));
  }

  if (!playerManager.livesQueue.length) {
    const req = await reqVideos('live');
    req.data.forEach(live => playerManager.livesQueue.push(live));
  }

  if (!playerManager.shortsQueue.length) {
    const req = await reqVideos('short');
    req.data.forEach(short => playerManager.shortsQueue.push(short));
  }
}

function checkIsPlaying() {
  setTimeout(() => {
    if (playerManager.isOpened && !playerManager.player.getCurrentTime()) {
      nextVideo();
    }
  }, 5000);
}

async function nextVideo() {
  await checkVideosQueue();

  if (!playerManager.types[playerManager.typeIndex]) {
    playerManager.typeIndex = 0;
  }

  switch (playerManager.types[playerManager.typeIndex]) {
    case 'video':
      playerManager.currentItem = playerManager.videosQueue.shift();
      break;
    case 'live':
      playerManager.currentItem = playerManager.livesQueue.shift();
      break;
    case 'short':
      playerManager.currentItem = playerManager.shortsQueue.shift();
      break;
  }

  playerManager.typeIndex++;
  playerManager.player.loadVideoById(playerManager.currentItem._id);
  playerManager.channelInfoElem.innerHTML = `
    <img class="channel-info-img" src="${
      playerManager.currentItem.channel.thumbnail
    }" />
    <div class="channel-info-txt">
      <div class="channel-info-title">${
        playerManager.currentItem.channel.title
      }</div>
      <div class="channel-info-date">${new Date(
        playerManager.currentItem.publishedAt
      ).toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
  `;
  playerManager.videoInfoElem.innerText = playerManager.currentItem.title;
  checkIsPlaying();
}

async function play() {
  await checkPlayer();
  nextVideo();
}

async function stop() {
  playerManager.player.stopVideo();
}

async function toggleVideos() {
  const videos = document.querySelector('.videos-bg');

  if (videos.style.display === 'flex') {
    videos.style.removeProperty('display');
    playerManager.isOpened = false;
    stop();
  } else {
    videos.style.display = 'flex';
    playerManager.isOpened = true;
    play();
  }
}
