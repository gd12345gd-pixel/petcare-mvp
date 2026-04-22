package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "pet")
@Data
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "avatar_url", nullable = false, length = 255)
    private String avatarUrl;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String age;

    @Column(nullable = false, length = 20)
    private String gender;

    @Column(nullable = false, length = 20)
    private String weight;

    @Column(nullable = false, length = 50)
    private String breed;

    @Column(name = "tags_json", columnDefinition = "TEXT")
    private String tagsJson;

    @Column(name = "has_aggression", nullable = false)
    private Integer hasAggression = 0;

    @Column(nullable = false)
    private Integer vaccinated = 1;

    @Column(length = 500)
    private String intro;

    @Column(name = "album_json", columnDefinition = "TEXT")
    private String albumJson;

    @Column(nullable = false)
    private Integer deleted = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;



    public Long getId() { return id; }
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

    public String getTagsJson() { return tagsJson; }
    public void setTagsJson(String tagsJson) { this.tagsJson = tagsJson; }

    public Integer getHasAggression() { return hasAggression; }
    public void setHasAggression(Integer hasAggression) { this.hasAggression = hasAggression; }

    public Integer getVaccinated() { return vaccinated; }
    public void setVaccinated(Integer vaccinated) { this.vaccinated = vaccinated; }

    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }

    public String getAlbumJson() { return albumJson; }
    public void setAlbumJson(String albumJson) { this.albumJson = albumJson; }

    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}