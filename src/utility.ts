export function DeconstructURL (url: string) {
  const location = (() => { 
    var file = url; 
    if (!file.includes('http://') && !file.includes('https://')) file = 'https://' + file;
    return new URL(file).href;
  })();

  const file = (() => {
    const split = location.split('/');
    console.log(split)
    return split[split.length - 1];
  })();

  const ext = (() => {
    const split = file.split('.');
    const ext = split[split.length - 1];
    return ext;
  })();

  return { location, file, ext }
}