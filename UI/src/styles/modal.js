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
      background: 'rgb(var(--surface))',
      color: 'rgb(var(--fg))',
      border: '1px solid rgb(var(--fg) / 0.1)',
      borderRadius: '20px',
      padding: '24px',
    },
};
