import React from 'react';

const Button = ({ children, onClick, type = 'button', className = '', variant = 'primary', style = {}, disabled = false }) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'outline': return 'outline';
            case 'ghost': return 'ghost';
            case 'error': return 'error';
            default: return '';
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`btn ${getVariantClass()} ${className}`}
            style={style}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
