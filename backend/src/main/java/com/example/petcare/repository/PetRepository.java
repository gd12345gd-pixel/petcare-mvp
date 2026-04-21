package com.example.petcare.repository;

import com.example.petcare.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {


    List<Pet> findByIdInAndUserIdAndDeleted(List<Long> ids, Long userId, Integer deleted);


    List<Pet> findByUserIdAndDeletedOrderByIdDesc(Long userId, Integer deleted);

    Optional<Pet> findByIdAndDeleted(Long id, Integer deleted);

    Optional<Pet> findByIdAndUserIdAndDeleted(Long id, Long userId, Integer deleted);
}