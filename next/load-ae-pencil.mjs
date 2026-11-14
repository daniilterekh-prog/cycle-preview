export async function loadAEPencil({base,signal,fetcher=fetch,Decompress=globalThis.DecompressionStream}){
 if(Decompress){
  try{
   const response=await fetcher(new URL('ae-pencil.json.gz',base),{signal});if(!response.ok)throw Error('Compressed sketch unavailable');
   return await new Response(response.body.pipeThrough(new Decompress('gzip'))).json();
  }catch(error){if(signal?.aborted||error.name==='AbortError')throw error;}
 }
 const response=await fetcher(new URL('ae-pencil.json',base),{signal});if(!response.ok)throw Error('AE sketch unavailable');return response.json();
}
