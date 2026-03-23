import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, IconButton, Typography } from '@mui/material'
import { ArrowBackIosNew, ConstructionOutlined } from '@mui/icons-material'
import { AppColors } from '../../constant/appColors'
import { TRADE_NAMESPACE } from '../../i18n'

const CopyTradeSetting = () => {
  const { t } = useTranslation(TRADE_NAMESPACE)
  const navigate = useNavigate()

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 1,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          px: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: AppColors.TXT_MAIN, px: 0.75 }}
          aria-label={t('tradeTop.backAriaLabel', 'Back')}
        >
          <ArrowBackIosNew sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t('copyTradeSetting.title')}
        </Typography>
      </Box>
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          px: 2,
        }}
      >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: AppColors.HLT_LIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        <ConstructionOutlined
          sx={{ fontSize: 48, color: AppColors.GOLD_PRIMARY }}
        />
      </Box>
      <Typography
        variant="h5"
        sx={{
          color: AppColors.TXT_MAIN,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {t('copyTradeSetting.title')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: AppColors.TXT_SUB,
          textAlign: 'center',
          maxWidth: 320,
        }}
      >
        {t('copyTradeSetting.description')}
      </Typography>
      <Typography
        variant="overline"
        sx={{
          color: AppColors.GOLD_PRIMARY,
          letterSpacing: 2,
          mt: 1,
        }}
      >
        {t('copyTradeSetting.comingSoon')}
      </Typography>
      </Box>
    </>
  )
}

export default CopyTradeSetting
