// Optional live smoke check. Uses the local gateway; never reads provider credentials.
const base='http://127.0.0.1:8000';
for(const [medium,q] of [['movie','Interstellar'],['tv','Severance'],['game','Cyberpunk 2077']]){
 const params=new URLSearchParams({q,medium,page:'1'});
 for(let run=1;run<=2;run++){
  const start=performance.now();const response=await fetch(`${base}/v1/catalog/search?${params}`,{signal:AbortSignal.timeout(22000)});const data=await response.json();
  console.log(JSON.stringify({medium,run,http:response.status,cache:response.headers.get('X-Catalog-Cache'),ms:Math.round((performance.now()-start)*100)/100,items:data.items?.length??0,status:data.status,errors:data.errors}));
  if(!response.ok)process.exitCode=1;
 }
}
