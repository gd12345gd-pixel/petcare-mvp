function formatPetAge(age) {
  const value = String(age || '').trim()
  if (!value) return ''
  if (value === '未填写') return value
  if (value.endsWith('岁')) return value
  return `${value}岁`
}

function formatPetWeight(weight) {
  const value = String(weight || '').trim()
  if (!value) return ''
  if (/kg$/i.test(value)) return value
  return `${value}kg`
}

function yesNoText(value, yesText, noText) {
  if (value === null || value === undefined || value === '') return '未填写'
  return Number(value) === 1 || value === true ? yesText : noText
}

function normalizePetSnapshot(pet = {}, defaultImage = '') {
  const petIntro = pet.petIntro || pet.petRemark || ''

  return {
    ...pet,
    petImageUrl: pet.petImageUrl || defaultImage,
    petName: pet.petName || '未命名宠物',
    petTypeText: pet.petType || '未知类型',
    petBreedText: pet.petBreed || '未填写品种',
    petGenderText: pet.petGender || '未填写',
    petAgeText: formatPetAge(pet.petAge) || '未填写',
    petWeightText: formatPetWeight(pet.petWeight) || '未填写',
    petAggressionText: yesNoText(pet.hasAggression, '有攻击性', '无攻击性'),
    petVaccinatedText: yesNoText(pet.vaccinated, '已接种', '未接种'),
    petRemarkText: petIntro || '暂无更多信息',
    petTags: Array.isArray(pet.petTags) ? pet.petTags.filter(Boolean) : [],
    petAlbumList: Array.isArray(pet.petAlbumList) ? pet.petAlbumList.filter(Boolean) : []
  }
}

module.exports = {
  formatPetAge,
  normalizePetSnapshot
}
