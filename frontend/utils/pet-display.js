function normalizePetSnapshot(pet = {}, defaultImage = '') {
  return {
    ...pet,
    petImageUrl: pet.petImageUrl || defaultImage,
    petName: pet.petName || '未命名宠物',
    petTypeText: pet.petType || '未知类型',
    petBreedText: pet.petBreed || '未填写品种',
    petGenderText: pet.petGender || '未填写',
    petAgeText: pet.petAge || '未填写',
    petRemarkText: pet.petRemark || '暂无更多信息'
  }
}

module.exports = {
  normalizePetSnapshot
}