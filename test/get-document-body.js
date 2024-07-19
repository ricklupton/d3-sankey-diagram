import {JSDOM} from 'jsdom'

export default function () {
  if (process.browser) {
    return document.querySelector('body')
  } else {
    const { document } = (new JSDOM()).window
    return document.querySelector('body')
  }
}
