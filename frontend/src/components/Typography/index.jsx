import React from 'react';
import styles from './typography.module.css';

const Typography = ({ 
  variant = 'body', 
  children, 
  className = '', 
  color,
  ...props 
}) => {
  const getTag = () => {
    switch (variant) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return variant;
      case 'bold':
        return 'strong';
      case 'body':
      default:
        return 'p';
    }
  };

  const getClassName = () => {
    const baseClass = styles[variant] || styles.body;
    return `${baseClass} ${className}`.trim();
  };

  const getStyle = () => {
    const style = {};
    // Se uma cor for fornecida, usa ela, senão usa --light-gray como padrão
    const colorValue = color ? `var(${color})` : 'var(--light-gray)';
    style['--typography-color'] = colorValue;
    return style;
  };

  const Tag = getTag();

  return (
    <Tag className={getClassName()} style={getStyle()} {...props}>
      {children}
    </Tag>
  );
};

export default Typography;
