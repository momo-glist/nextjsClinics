import React from 'react'
import Image from 'next/image'

interface PersonnelImageProps {
    src : string,
    alt : string,
    heightClass ? : string,
    widthClass ? : string,
}

const PersonnelImage : React.FC<PersonnelImageProps> = ({src, alt, heightClass, widthClass}) => {
  return (
    <div className='avatar'>
        <div className={` mask mask mask-squircle ${heightClass} ${widthClass}`}>
            <Image 
             src={src}
             alt={alt}
             quality={100}
             className='object-cover'
             height={500}
             width={500}
            />
        </div>
    </div>
  )
}

export default PersonnelImage