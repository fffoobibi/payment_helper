import { toRaw } from 'vue'

const viewImages = (urls, index = 0) => {
  console.log('urls ', urls)
  electron.viewImages(toRaw(urls), index)
}

const getIndexFromArray = (array, callback) => {
  // const a = []
  for (const i = 0; i < array.length; i++) {
    if (callback(array[i])) {
      return i
    }
  }
  // array.forEach((v, index)=>{
  //   if (callback(v)){

  //   }
  // })
  // const v = array.filter((v) => callback(v))
  // if (v.length) {
  //   return v[0]
  // }
}

export { viewImages, getIndexFromArray }
