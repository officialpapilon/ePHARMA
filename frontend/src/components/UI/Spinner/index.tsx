import { ClipLoader } from 'react-spinners';

const Loader = () => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.7)', 
          zIndex: 9999, 
          
        }}
      >
        <ClipLoader color="#36d7b7" size={50} />
      </div>
    );
  };
  

export default Loader;