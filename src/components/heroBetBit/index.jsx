import React from 'react'
import btLogo from '../../assets/images/btLogo.webp'
import './herobetbit.scss'

const HeroBetbit = () => {
    return (
        <div className="w-[150px] h-[150px] mx-auto my-4">
            <figure className="bitbit-logo w-full h-full object-contain">
                <img src={btLogo} />
            </figure>
        </div>
    )
}

export default HeroBetbit