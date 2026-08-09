(function () {
  'use strict';

  const form = document.getElementById('readiness-assessment');
  const output = document.getElementById('assessment-output');
  if (!form || !output) return;

  const volumeInput = document.getElementById('monthly-volume');
  const minutesInput = document.getElementById('minutes-per-item');
  const systemsInput = document.getElementById('system-count');
  const handoffsInput = document.getElementById('handoff-count');
  const controlsInput = document.getElementById('control-state');
  const accessInput = document.getElementById('access-state');
  const level = document.getElementById('assessment-level');
  const summary = document.getElementById('assessment-summary');
  const manualHours = document.getElementById('manual-hours');
  const priorityList = document.getElementById('priority-list');
  const calculateButton = document.getElementById('calculate-readiness');
  if (!calculateButton) return;

  function boundedNumber(input, minimum, maximum) {
    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) return minimum;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function formatHours(value) {
    const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded.toLocaleString()} ${rounded === 1 ? 'hour' : 'hours'}`;
  }

  function addPriority(items, text) {
    if (!items.includes(text)) items.push(text);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  calculateButton.addEventListener('click', function () {

    const volume = boundedNumber(volumeInput, 1, 100000);
    const minutes = boundedNumber(minutesInput, 0, 1440);
    const systems = boundedNumber(systemsInput, 1, 50);
    const handoffs = boundedNumber(handoffsInput, 0, 50);
    const controls = controlsInput.value;
    const access = accessInput.value;
    const representedHours = (volume * minutes) / 60;
    const priorities = [];

    let readinessLabel = 'Ready for a scoped evaluation';
    let readinessSummary = 'Your inputs indicate that the workflow has a useful starting definition. Confirm the details and evidence before connecting production access.';

    if (controls === 'unclear' || access === 'unclear') {
      readinessLabel = 'Foundation first';
      readinessSummary = 'Clarify ownership, controls, and system access before selecting automation or connecting data.';
    } else if (controls === 'partial' || access === 'available' || systems >= 5 || handoffs >= 4) {
      readinessLabel = 'Workflow mapping needed';
      readinessSummary = 'The workflow can be evaluated, but its mappings, handoffs, and controls should be documented before a pilot is scoped.';
    }

    if (controls === 'unclear') addPriority(priorities, 'Name the policy owner and document approvals, exceptions, stop conditions, and override authority.');
    if (controls === 'partial') addPriority(priorities, 'Complete the approval and exception map, including the person responsible for each decision.');
    if (access === 'unclear') addPriority(priorities, 'Identify the system owners, approved access path, authoritative records, and security review requirements.');
    if (access === 'available') addPriority(priorities, 'Map available exports or access to exact records, fields, events, and write-back actions.');
    if (systems >= 4) addPriority(priorities, 'Inventory each system touch and decide which system is authoritative at every handoff.');
    if (handoffs >= 3) addPriority(priorities, 'Test duplicate, missing, delayed, and failed handoffs as part of the representative evaluation.');
    if (minutes >= 30) addPriority(priorities, 'Separate repeatable preparation from judgment so the evaluation does not assume all current time is automatable.');
    addPriority(priorities, 'Record the current baseline and define how a reviewer will verify output quality and downstream outcomes.');

    level.textContent = readinessLabel;
    summary.textContent = readinessSummary;
    manualHours.textContent = formatHours(representedHours);
    priorityList.replaceChildren(...priorities.map(function (text) {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    output.hidden = false;
    output.focus({ preventScroll: true });
    output.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  form.addEventListener('reset', function () {
    output.hidden = true;
    priorityList.replaceChildren();
  });
})();
