package com.example.petcare.dto;

import java.util.List;

public class PetResponse {
    private Long id;
    private Long userId;
    private String avatarUrl;
    private String type;
    private String name;
    private String age;
    private String gender;
    private String weight;
    private String breed;
    private List<String> tags;
    private Integer hasAggression;
    private Integer vaccinated;
    private String intro;
    private List<String> albumList;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }
    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Integer getHasAggression() { return hasAggression; }
    public void setHasAggression(Integer hasAggression) { this.hasAggression = hasAggression; }
    public Integer getVaccinated() { return vaccinated; }
    public void setVaccinated(Integer vaccinated) { this.vaccinated = vaccinated; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public List<String> getAlbumList() { return albumList; }
    public void setAlbumList(List<String> albumList) { this.albumList = albumList; }
}