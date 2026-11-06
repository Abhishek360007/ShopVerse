export const customStyles = {
    overlay: {
      backgroundColor: 'rgba(5, 5, 10, 0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 60,
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(420px, calc(100vw - 32px))',
      background: '#15141d',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '24px',
    },
};
