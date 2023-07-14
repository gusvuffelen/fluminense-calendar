$(document).ready(async function () {
  const calendar = document.querySelector('#calendar');
  const logo = document.querySelector('.logo');
  const control = calendar.querySelector('.control');
  logo.remove();
  control.remove();

  $('#calendar').fullCalendar({
    ...configFullCalendar,
    eventClick: clickDay,
    eventRender: renderDay,
    viewRender: onChangeMonth
  });

  reqTournaments();
  reqMembersCount();

  const toolbar = document.querySelector('.fc-toolbar.fc-header-toolbar');
  const viewContainer = document.querySelector('.fc-view-container');

  calendar.insertBefore(control, viewContainer);
  toolbar.appendChild(logo);
});
