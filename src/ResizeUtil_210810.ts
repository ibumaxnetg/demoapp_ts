export async function imageReSizeCreate(inputImgFile: File, imgWidth: number) {

      // 画像リサイズ
      const resizeFile = inputImgFile;
      const resizeWidth = imgWidth;
      // let resizeString = '';

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext('2d')
      canvas.width = 0
      canvas.height = 0

      const sendFile = new Promise((resolve, reject) => {
        const imageCrop = new Image();
        imageCrop.onload = () => {
          const w = resizeWidth;
          const h = imageCrop.height * (resizeWidth / imageCrop.width)
          canvas.width = w
          canvas.height = h

          if (ctx !== null) {
            ctx.drawImage(imageCrop, 0, 0, w, h);
            canvas.toBlob((file) => {
              if (file) {

                const resizeNewFile = new File([file], 'newfileName.jpg', { lastModified: new Date().getTime(), type: file.type });
                // console.log('inputImgFile', inputImgFile);
                // console.log('resizeNewFile', resizeNewFile);
                resolve(resizeNewFile);
              }
            });
          }
        }

        imageCrop.onerror = (e) => reject(e);
        imageCrop.src = URL.createObjectURL(resizeFile);
      }).then((response) => {
        // console.log('imageReSizeCreate response', response);
        return response;
      }).catch(e => {
        console.log('imageReSizeCreate error', e);
      });

    return sendFile;
  };
