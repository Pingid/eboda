import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import useFileUpload from '../utils/useFileUpload';

const App = () => {
  const { progress, network, upload, url } = useFileUpload();

  const onDrop = useCallback(acceptedFiles => upload(acceptedFiles[0]), [upload])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag 'n' drop some files here, or click to select files</p>
        }
        <div>
          <h3>Network: {network}</h3>
          {progress !== 0 && <h1>{progress}</h1>}
          {network === 'done' && url && <a href={url}>download</a>}
        </div>
      </div>
    </div>
  )
}

export default App