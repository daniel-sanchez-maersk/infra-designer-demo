// src/client/main.ts
import { validateName } from '../lib/validation.js';

type Kind = 'vpc'|'subnet'|'sg'|'ec2'|'s3';
interface Block { id:string; kind:Kind; x:number; y:number; name?:string }

const icons: Record<Kind, string> = {
  vpc:   '/icons/aws/Networking/Amazon-VPC.svg',
  subnet:'/icons/aws/Networking/Amazon-VPC-Subnet.svg',
  sg:    '/icons/aws/Networking/Amazon-VPC-Security-Group.svg',
  ec2:   '/icons/aws/Compute/Amazon-EC2.svg',
  s3:    '/icons/aws/Storage/Amazon-S3.svg'
};

const blocks: Block[] = [];
let selected: string | undefined;

const canvas = document.getElementById('canvas') as HTMLDivElement;
const logEl  = document.getElementById('log') as HTMLDivElement;
const insp   = document.getElementById('inspectorBody') as HTMLDivElement;

function add(kind: Kind) {
  const b: Block = { id: crypto.randomUUID(), kind, x: 80, y: 80 };
  blocks.push(b);
  render();
}

function render() {
  canvas.innerHTML = '';
  for (const b of blocks) {
    const el = document.createElement('div');
    el.className = 'block';
    el.style.left = b.x + 'px';
    el.style.top  = b.y + 'px';
    el.draggable = true;

    el.addEventListener('dragstart', e => {
      (e.dataTransfer as DataTransfer).setData('text/plain', b.id);
    });
    el.addEventListener('click', () => {
      selected = b.id;
      updateInspector();
    });

    const img = document.createElement('img');
    img.src = icons[b.kind];
    img.alt = '';
    el.appendChild(img);
    canvas.appendChild(el);
  }
}

canvas.addEventListener('dragover', e => e.preventDefault());
canvas.addEventListener('drop', e => {
  e.preventDefault();
  const id = (e.dataTransfer as DataTransfer).getData('text/plain');
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 24;
  const y = e.clientY - rect.top - 24;
  const blk = blocks.find(bb => bb.id === id);
  if (blk) {
    blk.x = x; blk.y = y;
    render();
  }
});

function updateInspector() {
  const maybe = blocks.find(x => x.id === selected);
  if (!maybe) {
    insp.textContent = 'Select a block';
    return;
  }
  const sel: Block = maybe; // non-optional from here on

  const div = document.createElement('div');
  div.innerHTML = `
    <div class="prop"><span class="badge">Type</span> ${sel.kind.toUpperCase()}</div>
    <div class="prop">
      <label>Name</label>
      <input class="input" id="nm" placeholder="optional" value="${sel.name ?? ''}">
      <div id="nmv"></div>
    </div>
  `;

  insp.innerHTML = '';
  insp.appendChild(div);

  const nm  = document.getElementById('nm')  as HTMLInputElement;
  const nmv = document.getElementById('nmv') as HTMLDivElement;

  function validate() {
    const res = validateName(sel.kind as any, nm.value);
    nmv.className = res.ok ? 'ok' : 'err';
    nmv.textContent = res.ok ? '✓ valid' : `✗ ${res.msg}`;
  }

  nm.addEventListener('input', () => {
    sel.name = nm.value;
    validate();
  });

  validate();
}

// Wire resource buttons (icons)
for (const btn of Array.from(document.querySelectorAll('.res'))) {
  btn.addEventListener('click', () =>
    add((btn as HTMLButtonElement).dataset.kind as Kind)
  );
}

async function run(action: 'plan'|'apply'|'destroy') {
  const r = await fetch(`/api/terraform/${action}`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ blocks })
  });
  const t = await r.text();
  logEl.textContent = t;
}

document.getElementById('plan')!.addEventListener('click', () => run('plan'));
document.getElementById('apply')!.addEventListener('click', () => run('apply'));
document.getElementById('destroy')!.addEventListener('click', () => run('destroy'));

render();

