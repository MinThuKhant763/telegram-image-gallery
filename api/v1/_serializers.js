function image(row) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    caption: row.caption,
    senderName: row.sender_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    width: row.width,
    height: row.height,
    blurhash: row.blurhash
  };
}

function note(row) {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { image, note };
