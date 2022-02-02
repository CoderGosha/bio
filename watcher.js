const prebuilt = () => {
  require('child_process').execSync('npx b4d')
  console.log('Re-Pre-Built')
}
require('chokidar')
  .watch(['./content/', './overrides'], { ignoreInitial: true })
  .on('change', prebuilt)
  .on('add', prebuilt)
  .on('unlink', prebuilt)
