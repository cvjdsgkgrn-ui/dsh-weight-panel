window.__ModuleLoader__.load({
  id: 'dsh-weight-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'weight-panel';
    const STORE_KEY = 'dsh.weight-panel.v1';
    const FIELDS = ['weight', 'waist', 'steps', 'strength', 'walk'];


    const DICT = {
      zh: {
        label: '减重记录',
        title: '减重记录',
        subtitle: '数据只存在本机浏览器，不上传；换设备或清理站点数据会丢。',
        profile: '档案',
        profileNote: '只需填一次，可随时改。',
        height: '身高 (cm)',
        targetWeight: '目标体重 (kg)',
        targetDate: '目标日期',
        dailyCalories: '每日热量目标 (kcal)',
        dailyProtein: '每日蛋白目标 (g)',
        entry: '录入',
        date: '日期',
        weight: '体重 (kg)',
        waist: '腰围 (cm)',
        steps: '步数',
        strength: '力量 (分钟)',
        walk: '快走 (分钟)',
        save: '保存',
        saved: '已保存',
        emptyRecord: '没有可保存的数值',
        overview: '概览',
        latest: '最近体重',
        bmi: 'BMI',
        toGoal: '距目标',
        last7: '近 7 天平均',
        prev7: '前 7 天平均',
        change: '较前 7 天',
        week: '本周训练',
        weekStrength: '力量',
        weekWalk: '快走',
        weekSteps: '日均步数',
        eta: '按趋势预计达标',
        records: '记录',
        remove: '删除',
        copy: '复制给 DSH',
        copied: '已复制',
        copyFailed: '复制失败，请手动选择文本',
        nodata: '还没有记录，先保存一条今天的体重。',
        notrend: '数据不足',
      },
      en: {
        label: 'Weight log',
        title: 'Weight log',
        subtitle: 'Stored in this browser only. Clearing site data removes it.',
        profile: 'Profile',
        profileNote: 'Fill once; editable anytime.',
        height: 'Height (cm)',
        targetWeight: 'Target weight (kg)',
        targetDate: 'Target date',
        dailyCalories: 'Daily calories (kcal)',
        dailyProtein: 'Daily protein (g)',
        entry: 'Entry',
        date: 'Date',
        weight: 'Weight (kg)',
        waist: 'Waist (cm)',
        steps: 'Steps',
        strength: 'Strength (min)',
        walk: 'Brisk walk (min)',
        save: 'Save',
        saved: 'Saved',
        emptyRecord: 'Nothing to save',
        overview: 'Overview',
        latest: 'Latest',
        bmi: 'BMI',
        toGoal: 'To goal',
        last7: 'Last 7 days',
        prev7: 'Previous 7 days',
        change: 'Change',
        week: 'This week',
        weekStrength: 'Strength',
        weekWalk: 'Walk',
        weekSteps: 'Avg steps',
        eta: 'Projected goal',
        records: 'Records',
        remove: 'Delete',
        copy: 'Copy for DSH',
        copied: 'Copied',
        copyFailed: 'Copy failed; select the text manually',
        nodata: 'No records yet. Save today’s weight first.',
        notrend: 'Not enough data',
      },
    };

    const pad = (value) => String(value).padStart(2, '0');

    function isoDate(date) {
      const d = date || new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parseDate(dateStr) {
      return new Date(dateStr + 'T00:00:00');
    }

    function addDays(dateStr, days) {
      const d = parseDate(dateStr);
      d.setDate(d.getDate() + days);
      return isoDate(d);
    }

    function weekStart(dateStr) {
      const d = parseDate(dateStr);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return isoDate(d);
    }

    function dayIndex(dateStr) {
      return Math.round(parseDate(dateStr).getTime() / 86400000);
    }

    function num(value) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function fmt(value, digits) {
      return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits === undefined ? 1 : digits) : '—';
    }

    function inputValue(value) {
      return typeof value === 'number' && value > 0 ? String(value) : '';
    }

    function loadStore() {
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object') return { profile: {}, days: {} };
        return { profile: parsed.profile || {}, days: parsed.days || {} };
      } catch (error) {
        return { profile: {}, days: {} };
      }
    }

    function saveStore(state) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (error) {
        /* quota or private mode: the panel keeps working for this page load */
      }
    }

    function averageWeight(days, from, to) {
      const values = Object.keys(days)
        .filter((date) => date >= from && date <= to && num(days[date].weight) > 0)
        .map((date) => num(days[date].weight));
      if (!values.length) return null;
      return values.reduce((total, value) => total + value, 0) / values.length;
    }

    function stats(profile, days) {
      const dates = Object.keys(days).sort();
      const weighed = dates.filter((date) => num(days[date].weight) > 0);
      const latestDate = weighed.length ? weighed[weighed.length - 1] : null;
      const latestWeight = latestDate ? num(days[latestDate].weight) : null;
      const height = num(profile.height);
      const target = num(profile.targetWeight);
      const bmi = latestWeight && height ? latestWeight / Math.pow(height / 100, 2) : null;
      const toGoal = latestWeight !== null && target ? latestWeight - target : null;

      const today = isoDate();
      const avg7 = averageWeight(days, addDays(today, -6), today);
      const avgPrev7 = averageWeight(days, addDays(today, -13), addDays(today, -7));
      const delta = avg7 !== null && avgPrev7 !== null ? avg7 - avgPrev7 : null;

      const weekRows = dates.filter((date) => date >= weekStart(today)).map((date) => days[date]);
      const sum = (key) => weekRows.reduce((total, row) => total + num(row[key]), 0);
      const stepRows = weekRows.filter((row) => num(row.steps) > 0);
      const week = {
        strength: sum('strength'),
        walk: sum('walk'),
        steps: stepRows.length ? stepRows.reduce((total, row) => total + num(row.steps), 0) / stepRows.length : null,
      };

      let eta = null;
      let slope = null;
      const recent = weighed.filter((date) => date >= addDays(today, -20));
      if (recent.length >= 4) {
        const points = recent.map((date) => ({ x: dayIndex(date), y: num(days[date].weight) }));
        const meanX = points.reduce((total, p) => total + p.x, 0) / points.length;
        const meanY = points.reduce((total, p) => total + p.y, 0) / points.length;
        let covariance = 0;
        let variance = 0;
        for (const point of points) {
          covariance += (point.x - meanX) * (point.y - meanY);
          variance += Math.pow(point.x - meanX, 2);
        }
        slope = variance ? covariance / variance : null;
        if (slope !== null && slope < -0.01 && latestWeight !== null && target > 0) {
          const daysLeft = (latestWeight - target) / -slope;
          if (daysLeft > 0 && daysLeft < 900) eta = addDays(today, Math.round(daysLeft));
        }
      }

      return {
        latestDate,
        latestWeight,
        bmi,
        target,
        toGoal,
        avg7,
        avgPrev7,
        delta,
        week,
        eta,
        slope,
      };
    }

    const CSS = [
      '.wp-root{display:flex;flex-direction:column;gap:16px;padding:24px 28px 56px;max-width:840px;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}',
      '.wp-title{margin:0;font-size:18px;font-weight:600}',
      '.wp-sub{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.wp-card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:14px 16px}',
      '.wp-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px}',
      '.wp-card-title{font-size:13px;font-weight:600}',
      '.wp-note{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.wp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px 12px}',
      '.wp-field{display:flex;flex-direction:column;gap:5px;min-width:0}',
      '.wp-label{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.wp-input{font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:6px 9px;min-width:0}',
      '.wp-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.wp-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}',
      '.wp-btn{font:inherit;font-size:12px;padding:6px 14px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer}',
      '.wp-btn-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.wp-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.wp-quiet{font:inherit;font-size:11px;background:none;border:none;padding:0;color:var(--dsw-alias-label-secondary);cursor:pointer;text-decoration:underline}',
      '.wp-quiet:hover{color:var(--dsw-alias-state-error-primary)}',
      '.wp-status{font-size:12px;color:var(--dsw-alias-state-success-primary)}',
      '.wp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:12px}',
      '.wp-stat-label{font-size:11px;color:var(--dsw-alias-label-secondary);margin-bottom:2px}',
      '.wp-stat-value{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}',
      '.wp-stat-note{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}',
      '.wp-table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}',
      '.wp-table th{text-align:left;font-weight:500;font-size:11px;color:var(--dsw-alias-label-secondary);padding:4px 8px 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.wp-table td{padding:5px 8px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.wp-empty{font-size:12px;color:var(--dsw-alias-label-secondary)}',
    ].join('');

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const translate = (() => {
          try {
            ctx.locale.register(NS, 'zh', DICT.zh);
            ctx.locale.register(NS, 'en', DICT.en);
            return ctx.locale.bind(NS);
          } catch (error) {
            return (key) => DICT.zh[key] || key;
          }
        })();

        const useLocaleTick = () => {
          const [, bump] = React.useReducer((tick) => tick + 1, 0);
          React.useEffect(() => ctx.locale.subscribe(() => bump()), []);
        };

        function PanelIcon({ size = 16, active = false }) {
          return h(
            'svg',
            {
              width: size,
              height: size,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.8,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': true,
              style: { display: 'block', opacity: active ? 1 : 0.72 },
            },
            h('rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 3 }),
            h('path', { d: 'M7.5 14.5l3-3.2 2.4 2.4 3.6-4' }),
          );
        }

        function Field(props) {
          return h(
            'label',
            { className: 'wp-field' },
            h('span', { className: 'wp-label' }, props.label),
            h('input', {
              className: 'wp-input',
              type: props.type || 'number',
              step: props.step,
              inputMode: props.type === 'date' ? undefined : 'decimal',
              value: props.value,
              placeholder: props.placeholder,
              onChange: (event) => props.onChange(event.target.value),
            }),
          );
        }

        function Stat(props) {
          return h(
            'div',
            null,
            h('div', { className: 'wp-stat-label' }, props.label),
            h('div', { className: 'wp-stat-value' }, props.value),
            props.note ? h('div', { className: 'wp-stat-note' }, props.note) : null,
          );
        }

        function Panel() {
          useLocaleTick();
          const t = translate;
          const [state, setState] = React.useState(loadStore);
          const [status, setStatus] = React.useState('');
          const [form, setForm] = React.useState(() => ({
            date: isoDate(),
            weight: '',
            waist: '',
            steps: '',
            strength: '',
            walk: '',
          }));

          React.useEffect(() => {
            saveStore(state);
          }, [state]);

          const profile = state.profile;
          const days = state.days;
          const data = stats(profile, days);

          const edit = (key) => (value) => {
            setStatus('');
            setForm((prev) => ({ ...prev, [key]: value }));
          };

          const pickDate = (date) => {
            if (!date) return;
            setStatus('');
            const record = days[date] || {};
            setForm({
              date,
              weight: inputValue(record.weight),
              waist: inputValue(record.waist),
              steps: inputValue(record.steps),
              strength: inputValue(record.strength),
              walk: inputValue(record.walk),
            });
          };

          const submit = (event) => {
            event.preventDefault();
            const record = {};
            for (const key of FIELDS) {
              const value = num(form[key]);
              if (value > 0) record[key] = value;
            }
            if (!Object.keys(record).length) {
              setStatus(t('emptyRecord'));
              return;
            }
            setState((prev) => ({ ...prev, days: { ...prev.days, [form.date]: record } }));
            setStatus(t('saved'));
          };

          const removeDay = (date) => {
            setState((prev) => {
              const next = { ...prev.days };
              delete next[date];
              return { ...prev, days: next };
            });
            setStatus('');
          };

          const setProfileField = (key) => (value) => {
            setState((prev) => {
              // null / '' (not undefined) so a cleared field stays cleared across reloads
              if (key === 'targetDate') {
                return { ...prev, profile: { ...prev.profile, targetDate: value || '' } };
              }
              const parsed = num(value);
              return { ...prev, profile: { ...prev.profile, [key]: parsed > 0 ? parsed : null } };
            });
          };

          const copySummary = () => {
            const lines = [
              t('title') + ' ' + isoDate(),
              t('profile') + ': ' + t('height') + ' ' + inputValue(num(profile.height)) + ' / ' + t('targetWeight') + ' ' + inputValue(num(profile.targetWeight)) + (profile.targetDate ? ' (' + profile.targetDate + ')' : '') + ' / ' + t('dailyCalories') + ' ' + inputValue(num(profile.dailyCalories)) + ' / ' + t('dailyProtein') + ' ' + inputValue(num(profile.dailyProtein)),
              t('latest') + ': ' + (data.latestDate ? data.latestDate + ' ' + fmt(data.latestWeight) + 'kg' : '—') + '  BMI ' + fmt(data.bmi, 1) + '  ' + t('toGoal') + ' ' + fmt(data.toGoal) + 'kg',
              t('last7') + ': ' + fmt(data.avg7) + ' / ' + t('prev7') + ': ' + fmt(data.avgPrev7) + ' / ' + t('change') + ': ' + (data.delta === null ? '—' : (data.delta > 0 ? '+' : '') + fmt(data.delta)),
              t('week') + ': ' + t('weekStrength') + ' ' + fmt(data.week.strength, 0) + 'min / ' + t('weekWalk') + ' ' + fmt(data.week.walk, 0) + 'min / ' + t('weekSteps') + ' ' + fmt(data.week.steps, 0),
              t('eta') + ': ' + (data.eta || t('notrend')) + (data.slope === null ? '' : ' (' + fmt(data.slope, 2) + 'kg/day)'),
            ];
            const rows = Object.keys(days)
              .sort()
              .slice(-14)
              .map((date) => {
                const row = days[date];
                return (
                  date +
                  ' ' +
                  fmt(num(row.weight)) +
                  'kg' +
                  (num(row.waist) ? ' waist ' + fmt(num(row.waist)) : '') +
                  (num(row.steps) ? ' steps ' + fmt(num(row.steps), 0) : '') +
                  (num(row.strength) ? ' strength ' + fmt(num(row.strength), 0) + 'min' : '') +
                  (num(row.walk) ? ' walk ' + fmt(num(row.walk), 0) + 'min' : '')
                );
              });
            const text = lines.concat(['', t('records') + ':'].concat(rows)).join('\n');
            navigator.clipboard.writeText(text).then(
              () => setStatus(t('copied')),
              () => setStatus(t('copyFailed')),
            );
          };

          const recentDates = Object.keys(days).sort().reverse().slice(0, 14);

          return h(
            'div',
            { className: 'wp-root' },
            h('style', null, CSS),
            h(
              'header',
              null,
              h('h2', { className: 'wp-title' }, t('title')),
              h('p', { className: 'wp-sub' }, t('subtitle')),
            ),

            h(
              'section',
              { className: 'wp-card' },
              h(
                'div',
                { className: 'wp-head' },
                h('span', { className: 'wp-card-title' }, t('profile')),
                h('span', { className: 'wp-note' }, t('profileNote')),
              ),
              h(
                'div',
                { className: 'wp-grid' },
                h(Field, { label: t('height'), step: '0.1', placeholder: '170', value: inputValue(num(profile.height)), onChange: setProfileField('height') }),
                h(Field, { label: t('targetWeight'), step: '0.1', placeholder: '70', value: inputValue(num(profile.targetWeight)), onChange: setProfileField('targetWeight') }),
                h(Field, { label: t('targetDate'), type: 'date', value: profile.targetDate || '', onChange: setProfileField('targetDate') }),
                h(Field, { label: t('dailyCalories'), step: '10', placeholder: '1800', value: inputValue(num(profile.dailyCalories)), onChange: setProfileField('dailyCalories') }),
                h(Field, { label: t('dailyProtein'), step: '1', placeholder: '120', value: inputValue(num(profile.dailyProtein)), onChange: setProfileField('dailyProtein') }),
              ),
            ),

            h(
              'form',
              { className: 'wp-card', onSubmit: submit },
              h('div', { className: 'wp-head' }, h('span', { className: 'wp-card-title' }, t('entry'))),
              h(
                'div',
                { className: 'wp-grid' },
                h(Field, { label: t('date'), type: 'date', value: form.date, onChange: pickDate }),
                h(Field, { label: t('weight'), step: '0.1', placeholder: '70.0', value: form.weight, onChange: edit('weight') }),
                h(Field, { label: t('waist'), step: '0.1', value: form.waist, onChange: edit('waist') }),
                h(Field, { label: t('steps'), step: '1', value: form.steps, onChange: edit('steps') }),
                h(Field, { label: t('strength'), step: '1', value: form.strength, onChange: edit('strength') }),
                h(Field, { label: t('walk'), step: '1', value: form.walk, onChange: edit('walk') }),
              ),
              h(
                'div',
                { className: 'wp-row' },
                h('button', { type: 'submit', className: 'wp-btn wp-btn-primary' }, t('save')),
                h('button', { type: 'button', className: 'wp-btn', onClick: copySummary }, t('copy')),
                status ? h('span', { className: 'wp-status', role: 'status' }, status) : null,
              ),
            ),

            h(
              'section',
              { className: 'wp-card' },
              h('div', { className: 'wp-head' }, h('span', { className: 'wp-card-title' }, t('overview'))),
              data.latestWeight === null
                ? h('p', { className: 'wp-empty' }, t('nodata'))
                : h(
                    'div',
                    { className: 'wp-stats' },
                    h(Stat, { label: t('latest'), value: fmt(data.latestWeight) + ' kg', note: data.latestDate }),
                    h(Stat, { label: t('bmi'), value: fmt(data.bmi, 1) }),
                    h(Stat, { label: t('toGoal'), value: fmt(data.toGoal) + ' kg', note: data.target ? t('targetWeight') + ' ' + fmt(data.target) : '' }),
                    h(Stat, { label: t('last7'), value: fmt(data.avg7) + ' kg', note: t('change') + ' ' + (data.delta === null ? '—' : (data.delta > 0 ? '+' : '') + fmt(data.delta)) }),
                    h(Stat, { label: t('weekStrength'), value: fmt(data.week.strength, 0) + ' / 60 min' }),
                    h(Stat, { label: t('weekWalk'), value: fmt(data.week.walk, 0) + ' / 100 min' }),
                    h(Stat, { label: t('weekSteps'), value: fmt(data.week.steps, 0) + ' / 8000', note: t('week') }),
                    h(Stat, { label: t('eta'), value: data.eta || t('notrend'), note: data.slope === null ? '' : fmt(data.slope, 2) + ' kg/day' }),
                  ),
            ),

            h(
              'section',
              { className: 'wp-card' },
              h('div', { className: 'wp-head' }, h('span', { className: 'wp-card-title' }, t('records'))),
              recentDates.length === 0
                ? h('p', { className: 'wp-empty' }, t('nodata'))
                : h(
                    'table',
                    { className: 'wp-table' },
                    h(
                      'thead',
                      null,
                      h(
                        'tr',
                        null,
                        ['date', 'weight', 'waist', 'steps', 'strength', 'walk'].map((key) => h('th', { key }, t(key))),
                        h('th', null, ''),
                      ),
                    ),
                    h(
                      'tbody',
                      null,
                      recentDates.map((date) => {
                        const row = days[date] || {};
                        return h(
                          'tr',
                          { key: date },
                          h('td', null, date),
                          h('td', null, fmt(num(row.weight))),
                          h('td', null, num(row.waist) ? fmt(num(row.waist)) : '—'),
                          h('td', null, num(row.steps) ? fmt(num(row.steps), 0) : '—'),
                          h('td', null, num(row.strength) ? fmt(num(row.strength), 0) : '—'),
                          h('td', null, num(row.walk) ? fmt(num(row.walk), 0) : '—'),
                          h(
                            'td',
                            null,
                            h('button', { type: 'button', className: 'wp-quiet', onClick: () => removeDay(date) }, t('remove')),
                          ),
                        );
                      }),
                    ),
                  ),
            ),
          );
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'weight-panel',
              order: 30,
              label: () => translate('label'),
            },
            PanelIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'weight-panel' }, Panel),
        );
      },
    };
  },
});
