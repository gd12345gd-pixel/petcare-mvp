package com.example.petcare.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pet_order_pet")
public class PetOrderPet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "pet_id", nullable = false)
    private Long petId;

    @Column(name = "pet_name", length = 50)
    private String petName;

    @Column(name = "pet_type", length = 32)
    private String petType;

    @Column(name = "pet_breed", length = 50)
    private String petBreed;

    @Column(name = "pet_image_url", length = 255)
    private String petImageUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public String getPetName() { return petName; }
    public void setPetName(String petName) { this.petName = petName; }

    public String getPetType() { return petType; }
    public void setPetType(String petType) { this.petType = petType; }

    public String getPetBreed() { return petBreed; }
    public void setPetBreed(String petBreed) { this.petBreed = petBreed; }

    public String getPetImageUrl() { return petImageUrl; }
    public void setPetImageUrl(String petImageUrl) { this.petImageUrl = petImageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}