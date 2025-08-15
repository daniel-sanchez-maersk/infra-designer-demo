
export function validateName(kind: string, name: string): {ok:boolean; msg?:string} {
  if (!name || !name.trim()) return { ok:true };
  switch(kind){
    case 's3': return validateS3(name);
    case 'sg': return validateSecurityGroup(name);
    default: return { ok:true };
  }
}

function validateS3(n:string){
  const msg = (m:string)=>({ok:false,msg:m});
  if (n.length < 3 || n.length > 63) return msg('S3 bucket names must be 3–63 chars');
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(n)) return msg('Lowercase letters, numbers, dots, hyphens; must start/end with letter/number');
  if (n.includes('..')) return msg('No adjacent periods (..)');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(n)) return msg('Must not be an IP-style name');
  if (/^(xn--|sthree-|amzn-s3-demo-)/.test(n)) return msg('Reserved prefix not allowed');
  if (/(?:-s3alias|--ol-s3|\.mrap|--x-s3|--table-s3)$/.test(n)) return msg('Reserved suffix not allowed');
  return { ok:true };
}

function validateSecurityGroup(n:string){
  if (n.length < 1 || n.length > 255) return {ok:false,msg:'Security group names are 1–255 chars'};
  if (!/^[A-Za-z0-9 ._\-:\/()#,@\[\]+=&;{}!$*]+$/.test(n)) return {ok:false,msg:'Contains unsupported characters'};
  if (/^sg-/.test(n)) return {ok:false,msg:'Name cannot start with "sg-"'};
  return { ok:true };
}
