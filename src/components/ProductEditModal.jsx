import React, { useState, useEffect } from 'react';
import styles from './ProductEditModal.module.css';

const ProductEditModal = ({ product, onSave, onClose }) => {
  const [editedProduct, setEditedProduct] = useState(product);
  const [isDragging, setIsDragging] = useState(false);

  const categories = [
    { value: 'Upper', label: '상의' },
    { value: 'Lower', label: '하의' },
    { value: 'Dress', label: '원피스' },
  ];

  useEffect(() => {
    setEditedProduct(product);
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedProduct = {
      ...product,
      ...editedProduct,
      image: editedProduct.image || product.image,
      category: editedProduct.category || product.category,
      url: product.url,
      mall: product.mall
    };
    onSave(updatedProduct);
  };

  const handleImagePaste = (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function(event) {
          setEditedProduct({
            ...editedProduct,
            image: event.target.result
          });
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(event) {
        setEditedProduct({
          ...editedProduct,
          image: event.target.result
        });
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>상품 정보 수정</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div 
            className={`${styles.imageArea} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handleImagePaste}
            tabIndex="0"
          >
            {editedProduct.image ? (
              <>
                <img 
                  src={editedProduct.image} 
                  alt="상품 이미지" 
                  className={styles.productImage}
                />
                <div className={styles.imageOverlay}>
                  <p>다른 이미지로 변경하기</p>
                  <p className={styles.shortcut}>
                    드래그 앤 드롭 또는 Ctrl+V로 붙여넣기
                  </p>
                </div>
              </>
            ) : (
              <div className={styles.imagePlaceholder}>
                <p>이미지를 붙여넣거나 드래그하여 놓으세요</p>
                <p className={styles.shortcut}>(Ctrl+V)</p>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">카테고리</label>
            <div className={styles.categoryButtons}>
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.categoryButton} ${
                    (editedProduct.category === value || 
                     editedProduct.category === label) ? 
                    styles.categoryButtonActive : ''
                  }`}
                  onClick={() => setEditedProduct({...editedProduct, category: value})}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="brand">브랜드</label>
            <input
              id="brand"
              type="text"
              value={editedProduct.brand || ''}
              onChange={(e) => setEditedProduct({...editedProduct, brand: e.target.value})}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="name">상품명</label>
            <input
              id="name"
              type="text"
              value={editedProduct.name || ''}
              onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="price">가격</label>
            <input
              id="price"
              type="text"
              value={editedProduct.price || ''}
              onChange={(e) => {
                // 숫자와 쉼표만 허용
                const value = e.target.value.replace(/[^0-9,]/g, '');
                // 숫자만 추출하여 천단위 쉼표 추가
                const numericValue = value.replace(/,/g, '');
                const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                
                setEditedProduct({
                  ...editedProduct,
                  price: formattedValue ? `${formattedValue}원` : ''
                });
              }}
              className={styles.input}
              placeholder="예: 29,900원"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              취소
            </button>
            <button type="submit" className={styles.saveButton}>
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;