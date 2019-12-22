import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import useFileUpload from './utils/useFileUpload';
import { Helmet } from 'react-helmet'

const fileTypes = ['.ai', '.prproj', '.psd', '.aep', '.indd']
const HideMe = ({ visible, children }: { visible: boolean, children: React.ReactNode }) => <div className={'hide ' + (visible ? '' : 'me')}>{children}</div>

const App = () => {
  const { progress, network, upload, url } = useFileUpload();

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]
    if (file && fileTypes.reduce((onOf, ext) => onOf || new RegExp(ext, 'i').test(file.name), false)) {
      upload(file)
    } else {
      window.alert('we dont accept this file type')
    }
  }, [upload])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ accept: fileTypes, onDrop, multiple: false, disabled: network !== 'ready' })

  return (
    <div className="wrapper" {...getRootProps()}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>eboda</title>
        <meta name="description" content="Fix the adobe error 'The project was saved in a newer version'. Works for adobe premier pro, illustrator, photoshop, indesign..."></meta>
      </Helmet>
      <p className="about">fix adobe files that wont open on older software versions</p>
      <input {...getInputProps()} />

      <HideMe visible={network === 'ready' && isDragActive}><h2>Drop the file here</h2></HideMe>
      <HideMe visible={network === 'ready' && !isDragActive}><h2>drop your file here or <button className="button link">click</button> to find</h2></HideMe>
      <HideMe visible={network === 'processing' || network === 'requestURL' || network === 'uploading'}><h1>{progress}<span style={{ fontSize: '5vw' }}>%</span></h1></HideMe>
      <HideMe visible={network === 'error'}><h2 className="rainbow">something went wrong try again later</h2></HideMe>
      <HideMe visible={network === 'done'}><h2 className=""><a href={url as string} className="link">download</a></h2></HideMe>
    </div>
  )
}

export default App