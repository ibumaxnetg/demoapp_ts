import { firebaseStorage } from './fireconfig'

// イメージをリサイズする
export class ImageReSizeClass {

  constructor() {}

  async resizeImage(inputImgFile: File, imgWidth: number) {

    const resizeFile: File = inputImgFile;
    const resizeWidth: number = imgWidth;

    const canvasElement = document.createElement("canvas");
    const ctx:CanvasRenderingContext2D = canvasElement.getContext('2d')!;

    // canvasの解像度
    // const dpr = window.devicePixelRatio || 1;
    const dpr = 1;

    canvasElement.width = 0;
    canvasElement.height = 0;

    const sendFile: Promise<File| undefined| void> = new Promise((resolve:(value?: File) => void, reject: (reason?: any) => void) => {
      const imageCrop = new Image();
      imageCrop.onload = () => {
        const w = resizeWidth;
        const h = imageCrop.height * (resizeWidth / imageCrop.width);

        if (ctx !== null) {
          canvasElement.width = w * dpr;
          canvasElement.height = h * dpr;

          ctx.scale( dpr, dpr );

          canvasElement.style.width = w + 'px';
          canvasElement.style.height = h + 'px';

          ctx.drawImage(imageCrop, 0, 0, w, h);
          canvasElement.toBlob((file: Blob | null) => {
            if (file) {
              const resizeNewFile: File = new File([file], 'newfileName.jpg', { lastModified: new Date().getTime(), type: file.type });
              // console.log('inputImgFile', inputImgFile);
              // console.log('resizeNewFile', resizeNewFile);
                resolve(resizeNewFile);
            }
          });
        } else {
          const errorText = 'ファイルが展開できません35';
          reject(errorText);
        }
      }
      imageCrop.onerror = (e) => reject(e);
      imageCrop.src = URL.createObjectURL(resizeFile);

    }).then((newFile) => {
      // console.log('imageReSizeCreate response', response);
      return newFile;
    }).catch(erorr => {
      console.log('imageReSizeCreate error', erorr);
    });

    // console.log('sendFile:', sendFile);
    return sendFile
      .then((data) => {
        // console.log('imageReSizeCreate Data',data);
        return data;
      })
      .catch((error) => {
        console.log('imageReSizeCreate error', error);
      });
  }
}


// リサイズしてファイル FireStorage にUpする
export async function imageUpdateFireStorage(imageId: string, imageFile: File) {
  const imgSize = 400;
  const inputImgFile = imageFile;

  //ファイルのメタデータ
  const metadata = {
    name: 'newfileName.jpg',
    contentType: inputImgFile.type,
  };
  
  // 添字をつける
  let imgsoezi: string = '';
  // if (inputImgFile.type === 'image/jpeg') {
  //   imgsoezi = '.jpg';
  // } else if (inputImgFile.type === 'image/png') {
  //   imgsoezi = '.png';
  
  
  const resizeClass = new ImageReSizeClass();
  const inputImgFile2: File| undefined| void = await resizeClass.resizeImage(inputImgFile, imgSize);
  // console.log('resize => inputImgFile2:', inputImgFile2);
  
  if (inputImgFile2 !== undefined) {
    //画像ファイルのアップロード
    await firebaseStorage.ref().child("image/" + imageId + imgsoezi).put(inputImgFile2, metadata)
      .then((docRef) => {
        console.log("addProject Document ImgSet ID: ", imageId);
        console.log('addProject uploaddocRef:', docRef);
      })
      .catch((error) => {
        console.error("Error ImgSet document: ", error);
      });
  }
}
