const tournaments = {
  'Campeonato Brasileiro': {
    color: '#2c2d7c'
  },
  'CONMEBOL Libertadores': {
    color: '#e1b557'
  },
  'Copa do Brasil': {
    color: '#285e39'
  },
  'Campeonato Carioca': {
    color: '#25b8b4'
  },
  'CONMEBOL Sudamericana': {
    color: '#6a6a6a'
  },
  Amistoso: {
    color: '#ffffff'
  }
};

$(document).ready(async function () {
  $('#calendar').fullCalendar({
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
    eventClick: function (event) {
      const url = event.description?.match(/(https[^"]+)/);

      if (url) {
        window.open(url[1], '_blank');
        return false;
      }
    },
    eventRender: function (info) {
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
    },
    /** */
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
    ],
    viewRender: event => {
      const year = event.intervalStart.year();
      const month = (event.intervalStart.month() + 1)
        .toString()
        .padStart(2, '0');

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
  });

  $.get(
    'https://us-east-1.aws.data.mongodb-api.com/app/flucalendar-noygg/endpoint/getTournaments',
    res => {
      const json = JSON.parse(res);
      const elems = json.data.map(t => {
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');

        td1.setAttribute('width', '50');
        td1.setAttribute('align', 'center');
        td1.style.setProperty('background-color', t.primaryColorHex);
        td1.style.setProperty('border', `5px solid ${t.secondaryColorHex}`);
        td1.innerHTML = `<img class="legend-img" src="https://api.sofascore.app/api/v1/unique-tournament/${t._id}/image" />`;

        td2.className = 'legend-lable';
        td2.innerText = t.name;

        return [td1, td2];
      });

      const tr = document.querySelector('table.legend tr');
      elems.flat().forEach(elem => {
        tr.appendChild(elem);
      });
    }
  );

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
        'members',
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
      document.querySelector('#members').firstChild.onclick = e => {
        e.stopPropagation();
      };
    }
  );

  $.get(
    'https://us-east-1.aws.data.mongodb-api.com/app/flu-xtcyx/endpoint/getPlayers',
    players => {
      const playersDiv = document.querySelector('#players');

      players.forEach((player, i) => {
        const div = document.createElement('div');
        const bg = document.createElement('div');
        const content = document.createElement('div');

        div.className = 'player';
        div.style.display = !i ? 'block' : 'none';
        bg.className = 'player-bg';
        bg.style.backgroundImage = `url(${player.picture})`;
        content.className = 'player-content';
        content.innerHTML = `
          <table>
            <tr><td>Nome:</td><td>${player.name}</td></tr>
            <tr><td>Número:</td><td>${player.jersey}</td></tr>
            <tr><td>País:</td><td>${player.ctz}</td></tr>
            <tr><td>Idade:</td><td>${player.age}</td></tr>
            <tr><td>Altura:</td><td>${player.height}</td></tr>
            <tr><td>Peso:</td><td>${player.weight}</td></tr>
            <tr><td>Jogos:</td><td>${player.appearances}</td></tr>
            ${
              player.goalsConceded
                ? `<tr><td>Gols sofridos:</td><td>${player.goalsConceded}</td></tr>`
                : ''
            }
            <tr><td>Faltas cometidas:</td><td>${player.foulsCommitted}</td></tr>
            <tr><td>Faltas sofridas:</td><td>${player.foulsSuffered}</td></tr>
            <tr><td>Cartão amarelos:</td><td>${player.yellowCards}</td></tr>
            <tr><td>Cartão vermelhos:</td><td>${player.redCards}</td></tr>
          </table>
        `;

        div.appendChild(bg);
        div.appendChild(content);
        playersDiv.appendChild(div);
      });
    }
  );
});

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

function playerPrev(e) {
  const players = Array.from(document.querySelectorAll('#players .player'));
  const playersMap = players.reduce(
    (obj, v, i) => ({ ...obj, [`${i}`]: v }),
    {}
  );
  const currentIndex = players.findIndex(div => div.style.display === 'block');
  const current = playersMap[currentIndex];
  const newCurrent = playersMap[currentIndex - 1]
    ? playersMap[currentIndex - 1]
    : players.slice(-1)[0];

  current.style.display = 'none';
  newCurrent.style.display = 'block';
}

function playerNext() {
  const players = Array.from(document.querySelectorAll('#players .player'));
  const playersMap = players.reduce(
    (obj, v, i) => ({ ...obj, [`${i}`]: v }),
    {}
  );
  const currentIndex = players.findIndex(div => div.style.display === 'block');
  const current = playersMap[currentIndex];
  const newCurrent = playersMap[currentIndex + 1]
    ? playersMap[currentIndex + 1]
    : players[0];

  current.style.display = 'none';
  newCurrent.style.display = 'block';
}

function toISOString(date, hour = 0) {
  const newDate = new Date(+date);
  newDate.setHours(newDate.getHours() + hour);

  return newDate.toISOString().replace(/\.[0-9]{3}Z/, 'Z');
}

function toggleLegends() {
  const legends = document.querySelector('.legend-banner');

  if (legends.style.display === 'block') {
    legends.style.removeProperty('display');
  } else {
    legends.style.display = 'block';
  }
}

function toggleMembers() {
  const members = document.querySelector('#members');

  if (members.style.display === 'block') {
    members.style.removeProperty('display');
    members.style.removeProperty('position');
    members.style.removeProperty('top');
    members.style.removeProperty('left');
    members.style.removeProperty('background-color');
    members.style.removeProperty('max-width');
    members.style.removeProperty('width');
    members.style.removeProperty('height');
    members.style.removeProperty('padding-top');
    members.style.removeProperty('z-index');
  } else {
    members.style.display = 'block';
    members.style.position = 'fixed';
    members.style.top = '0';
    members.style.left = '0';
    members.style.backgroundColor = 'rgba(0,0,0,0.7)';
    members.style.maxWidth = '100%';
    members.style.width = '100%';
    members.style.height = '100%';
    members.style.paddingTop = '80px';
    members.style.zIndex = '4';
  }
}

function togglePlayers() {
  const players = document.querySelector('#players');

  if (players.style.display === 'block') {
    players.style.removeProperty('display');
    players.style.removeProperty('position');
    players.style.removeProperty('top');
    players.style.removeProperty('left');
    players.style.removeProperty('background-color');
    players.style.removeProperty('max-width');
    players.style.removeProperty('width');
    players.style.removeProperty('height');
    players.style.removeProperty('z-index');
  } else {
    players.style.display = 'block';
    players.style.position = 'fixed';
    players.style.top = '0';
    players.style.left = '0';
    players.style.backgroundColor = 'rgba(0,0,0,0.7)';
    players.style.maxWidth = '100%';
    players.style.width = '100%';
    players.style.height = '100%';
    players.style.zIndex = '4';
  }
}
