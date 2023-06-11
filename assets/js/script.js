$(document).ready(async function () {
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

  $('#calendar').fullCalendar({
    navLinks: true,
    editable: false,
    minTime: '7:30:00',
    maxTime: '21:30:00',
    contentHeight: 550,
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month'
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
    ]
  });

  function toISOString(date, hour = 0) {
    const newDate = new Date(+date);
    newDate.setHours(newDate.getHours() + hour);

    return newDate.toISOString().replace(/\.[0-9]{3}Z/, 'Z');
  }

  function getTeamLabel(team, score) {
    const attrTitle =
      document.body.clientWidth < 800 ? 'abbrev' : 'shortDisplayName';
    const labelScore = score ? `<td>(${score})</td>` : '';
    const labelName =
      document.body.clientWidth < 555 && labelScore
        ? team[attrTitle].charAt(0)
        : team[attrTitle];

    return `
      <table style="width:auto">
        <tr>
          <td><img width="15" src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/${
            team.id || team._id
          }.png&scale=crop&cquality=40&location=origin&w=40&h=40"/>
          </td>
          <td>${labelName}</td>
          ${labelScore}
        </tr>
      </table>
    `;
  }

  function getTitle(game) {
    const attrTitle =
      document.body.clientWidth < 800 ? 'abbrev' : 'shortDisplayName';
    const home = `${getTeamLabel(
      game.home,
      game.completed ? game.home.score.toString() : ''
    )}`;
    const visitor = `${getTeamLabel(
      game.visitor,
      game.completed ? game.visitor.score.toString() : ''
    )}`;
    let result = '';

    if (game.completed) {
      const flu = game.home.id === '3445' ? game.home : game.visitor;
      const rival = game.home.id === '3445' ? game.visitor : game.home;

      result = `${
        flu.score > rival.score ? '🟢' : flu.score < rival.score ? '🔴' : '🔘'
      }<br>`;
    }

    return `${result}${home}${visitor}`;
  }

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

  $.get(
    'https://us-east-1.aws.data.mongodb-api.com/app/flu-xtcyx/endpoint/getGames',
    res => {
      const events = res.map(game => {
        const uid = game._id;
        const color = tournaments[game.league].color;
        const start = toISOString(new Date(game.date), -3);
        const end = toISOString(new Date(game.date), -1);
        const title = getTitle(game);

        return {
          uid,
          color,
          title,
          start,
          end,
          completed: game.completed,
          hasTime: !game.status.detail.includes('A definir'),
          dtstamp: game.updated_at,
          created: game.created_at,
          'last-modified': game.updated_at,
          description: `<a href="https://www.espn.com.br${game.link}">Ver detalhes</a>`,
          status: 'CONFIRMED',
          transp: 'OPAQUE',
          sequence: 0
        };
      });

      $('#calendar').fullCalendar('addEventSource', events);
    }
  );
});

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
